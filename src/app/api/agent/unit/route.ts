import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateText, TeacherPrefsSchema, type TeacherPrefs } from '@/lib/ai';
import {
  UnitLessonSchema,
  parseUnitResponse,
  unitLessonRegenPrompt,
  unitSystemPrompt,
  unitUserPrompt,
  type UnitLesson,
  type UnitPlan,
} from '@/lib/ai/prompts/units';

const GenerateRequestSchema = z.object({
  action: z.literal('generate'),
  topic: z.string().min(1).max(400),
  weeks: z.number().int().min(1).max(20),
  lessonsPerWeek: z.number().int().min(1).max(10),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const RegenerateRequestSchema = z.object({
  action: z.literal('regenerate-lesson'),
  topic: z.string().min(1).max(400),
  weeks: z.number().int().min(1).max(20),
  lessonsPerWeek: z.number().int().min(1).max(10),
  lesson: UnitLessonSchema,
  otherLessons: z.array(UnitLessonSchema).default([]),
  teacherPrefs: TeacherPrefsSchema.optional(),
});

const UnitRequestSchema = z.discriminatedUnion('action', [
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

  const parsed = UnitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const teacherPrefs: TeacherPrefs = parsed.data.teacherPrefs ?? {};
  const system = unitSystemPrompt(teacherPrefs);

  if (parsed.data.action === 'generate') {
    const result = await generateText({
      system,
      messages: [
        {
          role: 'user',
          content: unitUserPrompt(parsed.data.topic, parsed.data.weeks, parsed.data.lessonsPerWeek),
        },
      ],
      maxTokens: 12000,
      temperature: 0.7,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error.message, kind: result.error.kind },
        { status: 502 },
      );
    }

    const parsed2 = parseUnitResponse(result.value);
    if (!parsed2) {
      return Response.json(
        { error: 'Could not parse a unit plan from the AI response.', raw: result.value },
        { status: 502 },
      );
    }

    const plan: UnitPlan = {
      topic: parsed.data.topic,
      weeks: parsed.data.weeks,
      lessonsPerWeek: parsed.data.lessonsPerWeek,
      overview: parsed2.overview,
      ac9Codes: parsed2.ac9Codes,
      assessment: parsed2.assessment,
      differentiation: parsed2.differentiation,
      resources: parsed2.resources,
      lessons: parsed2.lessons,
      generatedAt: Date.now(),
    };

    return Response.json({ plan });
  }

  // regenerate-lesson
  const result = await generateText({
    system,
    messages: [
      {
        role: 'user',
        content: unitLessonRegenPrompt(
          parsed.data.topic,
          parsed.data.weeks,
          parsed.data.lessonsPerWeek,
          parsed.data.lesson,
          parsed.data.otherLessons,
        ),
      },
    ],
    maxTokens: 2000,
    temperature: 0.7,
  });

  if (!result.ok) {
    return Response.json({ error: result.error.message, kind: result.error.kind }, { status: 502 });
  }

  const parsed2 = parseUnitResponse(result.value);
  const first = parsed2?.lessons[0];
  if (!parsed2 || !first) {
    return Response.json(
      { error: 'Could not parse the regenerated lesson.', raw: result.value },
      { status: 502 },
    );
  }

  const lesson: UnitLesson = {
    id: parsed.data.lesson.id,
    weekNumber: parsed.data.lesson.weekNumber,
    lessonNumber: parsed.data.lesson.lessonNumber,
    title: first.title,
    walt: first.walt,
    successCriteria: first.successCriteria,
    body: first.body,
  };

  return Response.json({ lesson });
}
