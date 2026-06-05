import { z } from 'zod';
import type { TeacherPrefs } from '@/lib/ai';

export const RubricLevelSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(60),
  description: z.string().max(200).default(''),
});
export type RubricLevel = z.infer<typeof RubricLevelSchema>;

export const RubricCriterionSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  descriptors: z.record(z.string(), z.string().min(1).max(400)),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const RubricSchema = z.object({
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(400),
  ac9Codes: z.array(z.string().max(40)).default([]),
  levels: z.array(RubricLevelSchema).min(2).max(6),
  criteria: z.array(RubricCriterionSchema).min(2).max(12),
  generatedAt: z.number().int().positive().optional(),
});
export type Rubric = z.infer<typeof RubricSchema>;

function prefsBlock(prefs: TeacherPrefs): string {
  const lines: string[] = [];
  if (prefs.yearLevel) lines.push(`Year level: ${prefs.yearLevel}`);
  if (prefs.subject) lines.push(`Subject: ${prefs.subject}`);
  if (prefs.state) lines.push(`State: ${prefs.state}`);
  if (prefs.classContext) lines.push(`Class context: ${prefs.classContext}`);
  return lines.length > 0 ? `\n\nTeacher context:\n${lines.join('\n')}` : '';
}

function levelGuidance(levelCount: number): string {
  if (levelCount === 3) {
    return 'Use exactly 3 levels: "Beginning", "Developing", "Extending".';
  }
  if (levelCount === 4) {
    return 'Use exactly 4 levels: "Beginning", "Developing", "Proficient", "Extending".';
  }
  if (levelCount === 5) {
    return 'Use exactly 5 levels: "Beginning", "Developing", "Proficient", "Accomplished", "Extending".';
  }
  return `Use exactly ${levelCount} levels with names appropriate to the assessment (e.g. "Below standard", "At standard", "Above standard" or a numeric 1..N).`;
}

const JSON_SHAPE = `Respond with ONE \`<rubric>\` XML block wrapping a JSON object. NO prose before or after.

<rubric>
{
  "title": "Persuasive writing rubric",
  "topic": "Persuasive writing: structure and emotive language",
  "ac9Codes": ["AC9E4LY02", "AC9E4LY03"],
  "levels": [
    { "id": "beginning", "name": "Beginning", "description": "Working towards the standard" },
    { "id": "developing", "name": "Developing", "description": "Approaching the standard" },
    { "id": "proficient", "name": "Proficient", "description": "At the standard" },
    { "id": "extending", "name": "Extending", "description": "Above the standard" }
  ],
  "criteria": [
    {
      "id": "thesis",
      "name": "Position / thesis",
      "descriptors": {
        "beginning": "States a position but it is unclear or shifts mid-piece.",
        "developing": "States a position and mostly sustains it.",
        "proficient": "States a clear position and sustains it throughout.",
        "extending": "States a precise, compelling position and anticipates counter-arguments."
      }
    }
  ]
}
</rubric>

Hard rules:
- "id" fields must be unique kebab-case slugs (no spaces).
- "levels" must contain exactly the level count the user requested.
- "criteria" must contain 4-7 criteria appropriate to the topic and year level.
- Every criterion must have a descriptor for every level id (no missing keys).
- Descriptors must be specific, observable, student-friendly, and tied to AC9 achievement standards where you can name them.
- "ac9Codes" should be real AC9 content descriptor codes where you can name them; if uncertain, omit (do NOT invent codes).`;

export function rubricSystemPrompt(prefs: TeacherPrefs): string {
  return `You are TeachWise, an expert Australian F-6 assessment designer aligned to the Australian Curriculum v9 (AC9). You produce structured assessment rubrics as criteria × levels matrices.

${JSON_SHAPE}

Use Australian school language and practical classroom detail. Make each descriptor observable and tied to the year level. Spell out the level names (Beginning, Developing, etc.) consistently.${prefsBlock(prefs)}`;
}

export function rubricUserPrompt(topic: string, levelCount: number): string {
  return `Assessment focus: ${topic.trim()}
Number of levels: ${levelCount}

${levelGuidance(levelCount)}

Produce the full structured rubric in the required <rubric> JSON format.`;
}

export function rubricCriterionRegenPrompt(
  rubric: Omit<Rubric, 'generatedAt'>,
  targetCriterionId: string,
): string {
  const levelsList = rubric.levels.map((l) => `- ${l.id}: ${l.name}`).join('\n');
  const otherCriteria = rubric.criteria
    .filter((c) => c.id !== targetCriterionId)
    .map((c) => `- ${c.name}`)
    .join('\n');
  const target = rubric.criteria.find((c) => c.id === targetCriterionId);
  return `Regenerate ONE criterion in this rubric.

Rubric title: ${rubric.title}
Topic: ${rubric.topic}

Levels:
${levelsList}

Existing criteria (do not duplicate):
${otherCriteria || '(none)'}

${target ? `Currently regenerating: "${target.name}" — replace it with a fresh criterion on a different aspect of the topic.` : ''}

Respond with ONE <rubric> JSON block containing exactly one level in "levels" (just the id "regen" is fine — it will be ignored) and a single-element "criteria" array — the regenerated criterion. Use the same level ids as the rubric above. Descriptors must cover every level id.`;
}

const RUBRIC_TAG_RE = /<rubric>([\s\S]*?)<\/rubric>/i;

export function parseRubricResponse(raw: string): Omit<Rubric, 'generatedAt'> | null {
  const match = raw.match(RUBRIC_TAG_RE);
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
      title: z.string().min(1).max(200),
      topic: z.string().min(1).max(400),
      ac9Codes: z.array(z.string()).default([]),
      levels: z.array(RubricLevelSchema).min(2).max(6),
      criteria: z.array(RubricCriterionSchema).min(2).max(12),
    })
    .safeParse(parsed);
  return shape.success ? shape.data : null;
}
