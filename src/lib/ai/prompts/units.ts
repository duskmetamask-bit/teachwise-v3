import { z } from 'zod';
import type { TeacherPrefs } from '@/lib/ai';

export const UnitLessonSchema = z.object({
  id: z.string().min(1),
  weekNumber: z.number().int().min(1).max(40),
  lessonNumber: z.number().int().min(1).max(20),
  title: z.string().min(1).max(160),
  walt: z.string().min(1).max(400),
  successCriteria: z.array(z.string().min(1).max(240)).min(1).max(8),
  body: z.string().min(1).max(4000),
});
export type UnitLesson = z.infer<typeof UnitLessonSchema>;

export const UnitPlanSchema = z.object({
  topic: z.string().max(400).default(''),
  weeks: z.number().int().min(1).max(20).default(4),
  lessonsPerWeek: z.number().int().min(1).max(10).default(3),
  overview: z.string().default(''),
  ac9Codes: z.array(z.string().max(40)).default([]),
  assessment: z.string().default(''),
  differentiation: z.string().default(''),
  resources: z.array(z.string().max(200)).default([]),
  lessons: z.array(UnitLessonSchema).default([]),
  coverImageUrl: z.string().url().optional(),
  coverImagePrompt: z.string().max(600).optional(),
  generatedAt: z.number().int().positive().optional(),
});
export type UnitPlan = z.infer<typeof UnitPlanSchema>;

function prefsBlock(prefs: TeacherPrefs): string {
  const lines: string[] = [];
  if (prefs.yearLevel) lines.push(`Year level: ${prefs.yearLevel}`);
  if (prefs.subject) lines.push(`Subject: ${prefs.subject}`);
  if (prefs.state) lines.push(`State: ${prefs.state}`);
  if (prefs.classContext) lines.push(`Class context: ${prefs.classContext}`);
  return lines.length > 0 ? `\n\nTeacher context:\n${lines.join('\n')}` : '';
}

const JSON_SHAPE = `Respond with ONE \`<unit>\` XML block wrapping a JSON object. NO prose before or after.

<unit>
{
  "overview": "Markdown overview of the unit (2-4 sentences explaining purpose, big idea, real-world relevance).",
  "ac9Codes": ["AC9M3N03", "AC9M3N04"],
  "assessment": "Markdown describing formative and summative assessment.",
  "differentiation": "Markdown describing support and extension strategies.",
  "resources": ["Resource 1", "Resource 2"],
  "lessons": [
    {
      "id": "week-1-lesson-1",
      "weekNumber": 1,
      "lessonNumber": 1,
      "title": "Introducing equivalent fractions",
      "walt": "We are learning to identify and create equivalent fractions using visual models.",
      "successCriteria": [
        "I can name two fractions as equivalent using a model.",
        "I can draw a model to show equivalent fractions."
      ],
      "body": "Markdown lesson sequence: hook, explicit teaching, guided practice, independent practice, reflection. Use timings."
    }
  ]
}
</unit>

Hard rules:
- "id" must be unique per lesson, kebab-case ("week-N-lesson-M").
- "weekNumber" and "lessonNumber" must be integers; cover every week from 1..weeks with lessonsPerWeek lessons each.
- "successCriteria" should be 3-5 specific, observable, student-friendly statements.
- "body" is markdown. Do not include the title inside the body.
- "ac9Codes" should be real AC9 content descriptor codes where you can name them; if uncertain, omit (do NOT invent codes).
- Keep each lesson body to 120-300 words.`;

export function unitSystemPrompt(prefs: TeacherPrefs): string {
  return `You are TeachWise, an expert Australian F-6 unit planner aligned to the Australian Curriculum v9 (AC9). You produce structured multi-lesson unit plans.

${JSON_SHAPE}

Use Australian school language, growth-focused phrasing, and practical classroom detail. Sequence lessons so each builds on the last. Spell out differentiation in terms of support and extension. Be specific — no generic filler.${prefsBlock(prefs)}`;
}

export function unitUserPrompt(topic: string, weeks: number, lessonsPerWeek: number): string {
  return `Topic / unit focus: ${topic.trim()}
Duration: ${weeks} ${weeks === 1 ? 'week' : 'weeks'}
Lessons per week: ${lessonsPerWeek}

Produce the full structured unit plan in the required <unit> JSON format. Exactly ${weeks * lessonsPerWeek} lessons total.`;
}

export function unitLessonRegenPrompt(
  topic: string,
  weeks: number,
  lessonsPerWeek: number,
  target: UnitLesson,
  otherLessons: UnitLesson[],
): string {
  const summary = otherLessons
    .sort((a, b) =>
      a.weekNumber === b.weekNumber ? a.lessonNumber - b.lessonNumber : a.weekNumber - b.weekNumber,
    )
    .map((l) => `- W${l.weekNumber} L${l.lessonNumber}: ${l.title}`)
    .join('\n');
  return `Regenerate ONLY lesson "Week ${target.weekNumber}, Lesson ${target.lessonNumber}" titled "${target.title}" for this unit.

Topic: ${topic}
Unit duration: ${weeks} weeks · ${lessonsPerWeek} lessons per week

Other lessons in the unit (do not duplicate their teaching):
${summary}

Respond with ONE <unit> JSON block containing only a single-element "lessons" array — the regenerated version of this lesson. Keep id "${target.id}", weekNumber ${target.weekNumber}, lessonNumber ${target.lessonNumber}. You may change title/walt/successCriteria/body. Body 120-300 words markdown.

You may include empty "overview", "ac9Codes", "assessment", "differentiation", and "resources" — they will be ignored.`;
}

const UNIT_TAG_RE = /<unit>([\s\S]*?)<\/unit>/i;

export function parseUnitResponse(raw: string): {
  overview: string;
  ac9Codes: string[];
  assessment: string;
  differentiation: string;
  resources: string[];
  lessons: UnitLesson[];
} | null {
  const match = raw.match(UNIT_TAG_RE);
  const candidate = match ? match[1] : raw;
  if (!candidate) return null;
  const trimmed = candidate.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const inner = trimmed.match(/\{[\s\S]*\}/);
    if (!inner) return null;
    try {
      parsed = JSON.parse(inner[0]);
    } catch {
      return null;
    }
  }
  const shape = z
    .object({
      overview: z.string().default(''),
      ac9Codes: z.array(z.string()).default([]),
      assessment: z.string().default(''),
      differentiation: z.string().default(''),
      resources: z.array(z.string()).default([]),
      lessons: z.array(UnitLessonSchema).default([]),
    })
    .safeParse(parsed);
  return shape.success ? shape.data : null;
}
