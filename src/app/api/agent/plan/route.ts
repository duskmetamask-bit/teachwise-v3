import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateText, TeacherPrefsSchema, type TeacherPrefs } from '@/lib/ai';
import {
  PlannerBlockSchema,
  parsePlanResponse,
  plannerBlockRegenPrompt,
  plannerSystemPrompt,
  plannerUserPrompt,
  type PlannerBlock,
} from '@/lib/ai/prompts/planner';

const GenerateRequestSchema = z.object({
  action: z.literal('generate'),
  topic: z.string().min(1).max(400),
  duration: z.string().min(1).max(80),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const RegenerateRequestSchema = z.object({
  action: z.literal('regenerate-block'),
  topic: z.string().min(1).max(400),
  duration: z.string().min(1).max(80),
  block: PlannerBlockSchema,
  otherBlocks: z.array(PlannerBlockSchema).default([]),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const PlanRequestSchema = z.discriminatedUnion('action', [
  GenerateRequestSchema,
  RegenerateRequestSchema,
]);

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = PlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const teacherPrefs: TeacherPrefs = parsed.data.teacherPrefs ?? {};
  const system = plannerSystemPrompt(teacherPrefs);

  if (parsed.data.action === 'generate') {
    const result = await generateText({
      system,
      messages: [
        { role: 'user', content: plannerUserPrompt(parsed.data.topic, parsed.data.duration) },
      ],
      maxTokens: 6000,
      temperature: 0.7,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error.message, kind: result.error.kind },
        { status: 502 },
      );
    }

    const plan = parsePlanResponse(result.value);
    if (!plan) {
      return Response.json(
        { error: 'Could not parse a plan from the AI response.', raw: result.value },
        { status: 502 },
      );
    }

    const blocks: PlannerBlock[] = plan.blocks.map((b) => ({
      id: b.id,
      kind: b.kind,
      heading: b.heading,
      body: b.body,
    }));

    return Response.json({ blocks });
  }

  // regenerate-block
  const result = await generateText({
    system,
    messages: [
      {
        role: 'user',
        content: plannerBlockRegenPrompt(
          parsed.data.topic,
          parsed.data.duration,
          parsed.data.block,
          parsed.data.otherBlocks,
        ),
      },
    ],
    maxTokens: 2000,
    temperature: 0.7,
  });

  if (!result.ok) {
    return Response.json({ error: result.error.message, kind: result.error.kind }, { status: 502 });
  }

  const plan = parsePlanResponse(result.value);
  const first = plan?.blocks[0];
  if (!plan || !first) {
    return Response.json(
      { error: 'Could not parse the regenerated block.', raw: result.value },
      { status: 502 },
    );
  }

  const block: PlannerBlock = {
    id: parsed.data.block.id,
    kind: first.kind,
    heading: first.heading,
    body: first.body,
    ...(parsed.data.block.imageUrl ? { imageUrl: parsed.data.block.imageUrl } : {}),
    ...(parsed.data.block.imagePrompt ? { imagePrompt: parsed.data.block.imagePrompt } : {}),
  };

  return Response.json({ block });
}
