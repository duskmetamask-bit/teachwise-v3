import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateText, TeacherPrefsSchema, type TeacherPrefs } from '@/lib/ai';
import {
  RubricSchema,
  parseRubricResponse,
  rubricCriterionRegenPrompt,
  rubricSystemPrompt,
  rubricUserPrompt,
  type Rubric,
  type RubricCriterion,
} from '@/lib/ai/prompts/rubric';

const GenerateRequestSchema = z.object({
  action: z.literal('generate'),
  topic: z.string().min(1).max(400),
  levelCount: z.number().int().min(2).max(6),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const RegenerateRequestSchema = z.object({
  action: z.literal('regenerate-criterion'),
  topic: z.string().min(1).max(400),
  levelCount: z.number().int().min(2).max(6),
  rubric: RubricSchema,
  targetCriterionId: z.string().min(1).max(60),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const RubricRequestSchema = z.discriminatedUnion('action', [
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

  const parsed = RubricRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const teacherPrefs: TeacherPrefs = parsed.data.teacherPrefs ?? {};
  const system = rubricSystemPrompt(teacherPrefs);

  if (parsed.data.action === 'generate') {
    const result = await generateText({
      system,
      messages: [
        {
          role: 'user',
          content: rubricUserPrompt(parsed.data.topic, parsed.data.levelCount),
        },
      ],
      maxTokens: 6000,
      temperature: 0.6,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error.message, kind: result.error.kind },
        { status: 502 },
      );
    }

    const parsed2 = parseRubricResponse(result.value);
    if (!parsed2) {
      return Response.json(
        { error: 'Could not parse a rubric from the AI response.', raw: result.value },
        { status: 502 },
      );
    }

    const rubric: Rubric = {
      title: parsed2.title,
      topic: parsed2.topic,
      ac9Codes: parsed2.ac9Codes,
      levels: parsed2.levels,
      criteria: parsed2.criteria,
      generatedAt: Date.now(),
    };

    return Response.json({ rubric });
  }

  // regenerate-criterion
  const result = await generateText({
    system,
    messages: [
      {
        role: 'user',
        content: rubricCriterionRegenPrompt(parsed.data.rubric, parsed.data.targetCriterionId),
      },
    ],
    maxTokens: 2000,
    temperature: 0.7,
  });

  if (!result.ok) {
    return Response.json({ error: result.error.message, kind: result.error.kind }, { status: 502 });
  }

  const parsed2 = parseRubricResponse(result.value);
  const first = parsed2?.criteria[0];
  if (!parsed2 || !first) {
    return Response.json(
      { error: 'Could not parse the regenerated criterion.', raw: result.value },
      { status: 502 },
    );
  }

  // Ensure descriptors cover the rubric's actual level ids (AI may have used its own level names).
  const normalizedDescriptors: Record<string, string> = {};
  for (const level of parsed.data.rubric.levels) {
    const value = first.descriptors[level.id];
    if (value) {
      normalizedDescriptors[level.id] = value;
    } else {
      // Try matching by level name as a fallback.
      const matchingLevel = parsed2.levels.find(
        (l) => l.name.toLowerCase() === level.name.toLowerCase(),
      );
      const fallbackKey = matchingLevel ? matchingLevel.id : level.id;
      normalizedDescriptors[level.id] = first.descriptors[fallbackKey] ?? '';
    }
  }

  const criterion: RubricCriterion = {
    id: parsed.data.targetCriterionId,
    name: first.name,
    descriptors: normalizedDescriptors,
  };

  return Response.json({ criterion });
}
