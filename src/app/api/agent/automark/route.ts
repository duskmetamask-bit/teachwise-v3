import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateText, TeacherPrefsSchema, type TeacherPrefs } from '@/lib/ai';
import {
  automarkSystemPrompt,
  automarkUserPrompt,
  parseAutomarkResponse,
  type AutomarkResult,
} from '@/lib/ai/prompts/automark';
import { RubricSchema, type Rubric } from '@/lib/ai/prompts/rubric';

const RequestSchema = z.object({
  topic: z.string().min(1).max(400),
  rubric: RubricSchema.nullable().optional(),
  studentWork: z.string().min(1).max(20000),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const teacherPrefs: TeacherPrefs = parsed.data.teacherPrefs ?? {};
  const rubric: Rubric | null = parsed.data.rubric ?? null;
  const system = automarkSystemPrompt(teacherPrefs);

  const result = await generateText({
    system,
    messages: [
      {
        role: 'user',
        content: automarkUserPrompt(parsed.data.topic, rubric, parsed.data.studentWork),
      },
    ],
    maxTokens: 4000,
    temperature: 0.5,
  });

  if (!result.ok) {
    return Response.json({ error: result.error.message, kind: result.error.kind }, { status: 502 });
  }

  const parsed2 = parseAutomarkResponse(result.value);
  if (!parsed2) {
    return Response.json(
      { error: 'Could not parse a mark from the AI response.', raw: result.value },
      { status: 502 },
    );
  }

  // CRITICAL: do NOT echo the student work back. Only the AI feedback is returned.
  const feedback: AutomarkResult = parsed2;
  return Response.json({ feedback });
}
