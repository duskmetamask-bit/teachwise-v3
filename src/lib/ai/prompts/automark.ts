import { z } from 'zod';
import type { TeacherPrefs } from '@/lib/ai';
import type { Rubric } from '@/lib/ai/prompts/rubric';

export const AutomarkCriterionResultSchema = z.object({
  criterionId: z.string().min(1).max(60),
  criterionName: z.string().min(1).max(120),
  levelId: z.string().min(1).max(40),
  levelName: z.string().min(1).max(60),
  comment: z.string().min(1).max(800),
});
export type AutomarkCriterionResult = z.infer<typeof AutomarkCriterionResultSchema>;

export const AutomarkResultSchema = z.object({
  rubricTitle: z.string().max(200),
  overallLevel: z.string().min(1).max(60),
  overallSummary: z.string().min(1).max(1200),
  perCriterion: z.array(AutomarkCriterionResultSchema).min(1).max(20),
  strengths: z.array(z.string().min(1).max(200)).min(1).max(6),
  nextSteps: z.array(z.string().min(1).max(200)).min(1).max(6),
});
export type AutomarkResult = z.infer<typeof AutomarkResultSchema>;

function prefsBlock(prefs: TeacherPrefs): string {
  const lines: string[] = [];
  if (prefs.yearLevel) lines.push(`Year level: ${prefs.yearLevel}`);
  if (prefs.subject) lines.push(`Subject: ${prefs.subject}`);
  if (prefs.state) lines.push(`State: ${prefs.state}`);
  if (prefs.classContext) lines.push(`Class context: ${prefs.classContext}`);
  return lines.length > 0 ? `\n\nTeacher context:\n${lines.join('\n')}` : '';
}

const JSON_SHAPE = `Respond with ONE \`<automark>\` XML block wrapping a JSON object. NO prose before or after.

<automark>
{
  "rubricTitle": "Persuasive writing rubric",
  "overallLevel": "Proficient",
  "overallSummary": "Markdown 1-3 sentence overall assessment. Be specific and growth-minded. Reference what the student did.",
  "perCriterion": [
    {
      "criterionId": "thesis",
      "criterionName": "Clear position",
      "levelId": "proficient",
      "levelName": "Proficient",
      "comment": "Markdown 1-2 sentences of specific, actionable feedback tied to what the student did or didn't do."
    }
  ],
  "strengths": [
    "Strength 1 — specific to this piece.",
    "Strength 2 — specific to this piece."
  ],
  "nextSteps": [
    "Actionable next step 1.",
    "Actionable next step 2."
  ]
}
</automark>

Hard rules:
- "rubricTitle" must match the rubric provided (or echo the assessment focus if no rubric).
- "perCriterion" must cover every criterion in the rubric (or 1-2 sensible criteria if no rubric).
- Each per-criterion "levelId" and "levelName" must match a level in the rubric (or use a sensible default like "developing" if no rubric).
- "strengths" and "nextSteps" each 2-4 items, specific to this piece — no generic platitudes.
- "overallLevel" should reflect the dominant level the student is working at.
- Be fair, growth-minded, and specific. Reference what the student actually did, not what they didn't.`;

export function automarkSystemPrompt(prefs: TeacherPrefs): string {
  return `You are TeachWise, an expert Australian F-6 assessor aligned to the Australian Curriculum v9 (AC9). You mark student work against a provided rubric, or — if no rubric is provided — against sensible criteria for the topic. You return structured, growth-minded feedback.

${JSON_SHAPE}

Use Australian school language. Be honest about strengths AND specific about what to do next. Never invent rubric levels or criterion names that weren't given.${prefsBlock(prefs)}`;
}

function rubricBlock(rubric: Rubric | null): string {
  if (!rubric)
    return '\n\nNo rubric was provided. Mark against 1-2 sensible criteria appropriate to the assessment focus. Use "developing" as a default level if you have nothing else.';
  const criteria = rubric.criteria
    .map((c) => {
      const levels = rubric.levels
        .map((l) => `    - ${l.id} (${l.name}): ${c.descriptors[l.id] ?? ''}`)
        .join('\n');
      return `  - id: "${c.id}", name: "${c.name}"\n${levels}`;
    })
    .join('\n');
  return `\n\nRubric to mark against:\nTitle: ${rubric.title}\nLevels: ${rubric.levels.map((l) => `${l.id}=${l.name}`).join(', ')}\nCriteria:\n${criteria}`;
}

export function automarkUserPrompt(
  topic: string,
  rubric: Rubric | null,
  studentWork: string,
): string {
  return `Assessment focus: ${topic.trim()}${rubricBlock(rubric)}

Student work to mark:
"""
${studentWork.trim()}
"""

Produce the full structured mark in the required <automark> JSON format.`;
}

const AUTOMARK_TAG_RE = /<automark>([\s\S]*?)<\/automark>/i;

export function parseAutomarkResponse(raw: string): AutomarkResult | null {
  const match = raw.match(AUTOMARK_TAG_RE);
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
  const shape = AutomarkResultSchema.safeParse(parsed);
  return shape.success ? shape.data : null;
}
