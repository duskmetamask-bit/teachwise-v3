import { z } from 'zod';
import type { TeacherPrefs } from '@/lib/ai';

export const PLANNER_BLOCK_KINDS = [
  'warm-up',
  'main',
  'practice',
  'extension',
  'exit-ticket',
  'materials',
  'notes',
] as const;

export const PlannerBlockKindSchema = z.enum(PLANNER_BLOCK_KINDS);
export type PlannerBlockKind = z.infer<typeof PlannerBlockKindSchema>;

export const PlannerBlockSchema = z.object({
  id: z.string().min(1),
  kind: PlannerBlockKindSchema,
  heading: z.string().min(1).max(120),
  body: z.string().min(1).max(4000),
  imageUrl: z.string().url().optional(),
  imagePrompt: z.string().max(600).optional(),
});
export type PlannerBlock = z.infer<typeof PlannerBlockSchema>;

export const PlannerStateSchema = z.object({
  topic: z.string().max(400).default(''),
  duration: z.string().max(80).default(''),
  generatedAt: z.number().int().positive().optional(),
  blocks: z.array(PlannerBlockSchema).default([]),
});
export type PlannerState = z.infer<typeof PlannerStateSchema>;

function prefsBlock(prefs: TeacherPrefs): string {
  const lines: string[] = [];
  if (prefs.yearLevel) lines.push(`Year level: ${prefs.yearLevel}`);
  if (prefs.subject) lines.push(`Subject: ${prefs.subject}`);
  if (prefs.state) lines.push(`State: ${prefs.state}`);
  if (prefs.classContext) lines.push(`Class context: ${prefs.classContext}`);
  return lines.length > 0 ? `\n\nTeacher context:\n${lines.join('\n')}` : '';
}

const KIND_GUIDE = `Use these block kinds (you may omit any that don't fit, and may repeat "main" or "practice" if the lesson is long):
- "warm-up": short hook to engage the class (~5 min).
- "main": explicit teaching / new concept delivery.
- "practice": guided or independent practice activity.
- "extension": challenge / early-finisher task.
- "exit-ticket": short formative check at the end.
- "materials": bullet list of physical and digital resources required.
- "notes": teacher-only notes on differentiation, behaviour, transitions.`;

const JSON_SHAPE = `Respond with ONE \`<plan>\` XML block wrapping a JSON object. NO prose before or after.

<plan>
{
  "blocks": [
    {
      "id": "warm-up-1",
      "kind": "warm-up",
      "heading": "Number talk: doubles to 20",
      "body": "Markdown body. Use **bold**, bullet lists, numbered steps. Include timing in minutes inside the body if relevant. Keep each block to 80-250 words."
    },
    { "...": "more blocks" }
  ]
}
</plan>

Hard rules:
- "id" must be unique within the plan, kebab-case, descriptive.
- "kind" must be one of: ${PLANNER_BLOCK_KINDS.map((k) => `"${k}"`).join(', ')}.
- "body" is markdown. Do NOT include the heading inside the body.
- The plan should fit the requested duration. Sum of block timings should match.
- Order blocks in the sequence a teacher would deliver them.
- Always include at least: warm-up, main, practice, exit-ticket. Include materials and notes when useful.`;

export function plannerSystemPrompt(prefs: TeacherPrefs): string {
  return `You are TeachWise, an expert Australian F-6 lesson planner. You produce structured, block-based lesson plans aligned to the Australian Curriculum v9 (AC9).

${KIND_GUIDE}

${JSON_SHAPE}

Use Australian school language, growth-focused phrasing, AC9 references where natural. Be specific and immediately classroom-usable — no padding, no generic filler.${prefsBlock(prefs)}`;
}

export function plannerUserPrompt(topic: string, duration: string): string {
  const trimmedTopic = topic.trim();
  const trimmedDuration = duration.trim();
  const durationLine = trimmedDuration
    ? `Lesson duration: ${trimmedDuration}`
    : 'Lesson duration: 60 minutes (default)';
  return `Topic / focus: ${trimmedTopic}\n${durationLine}\n\nProduce the full block-based lesson plan in the required <plan> JSON format.`;
}

export function plannerBlockRegenPrompt(
  topic: string,
  duration: string,
  block: PlannerBlock,
  otherBlocks: PlannerBlock[],
): string {
  const summary = otherBlocks.map((b) => `- ${b.kind} — ${b.heading}`).join('\n');
  return `Regenerate ONLY the "${block.kind}" block titled "${block.heading}" for this lesson.

Topic: ${topic}
Duration: ${duration}

Other blocks already in the plan (do not duplicate their content):
${summary}

Respond with ONE <plan> block containing exactly one entry in "blocks": the regenerated version of the "${block.kind}" block. Keep the same id "${block.id}". You may change the heading. Body is markdown, 80-250 words.`;
}

const PLAN_TAG_RE = /<plan>([\s\S]*?)<\/plan>/i;

const PlanPayloadSchema = z.object({
  blocks: z.array(PlannerBlockSchema.omit({ imageUrl: true, imagePrompt: true })).min(1),
});

export type ParsedPlan = z.infer<typeof PlanPayloadSchema>;

export function parsePlanResponse(raw: string): ParsedPlan | null {
  const match = raw.match(PLAN_TAG_RE);
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
  const result = PlanPayloadSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
