import { z } from 'zod';
import { Err, Ok, type Result, type AiError } from '@/lib/ai';

// ─── Config ───────────────────────────────────────────────────────────────
// TODO: confirm the MiniMax image endpoint with the user. The v2 codebase
// only wired text (api.minimax.io/anthropic/v1/messages). Until the image
// gateway is confirmed, this is a placeholder structure that you can fill
// in once you have the real URL + model name.
const IMAGE_GATEWAY =
  process.env.MINIMAX_IMAGE_URL ?? 'https://api.minimax.io/v1/images/generations';
const DEFAULT_IMAGE_MODEL = process.env.MINIMAX_IMAGE_MODEL ?? 'MiniMax-Image-01';

// ─── Schemas ──────────────────────────────────────────────────────────────
export const ImageGenInputSchema = z.object({
  prompt: z.string().min(1).max(2000),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024'),
  count: z.number().int().min(1).max(4).default(1),
});
export type ImageGenInput = z.infer<typeof ImageGenInputSchema>;

export const ImageGenOutputSchema = z.object({
  urls: z.array(z.string().url()),
  revisedPrompt: z.string().optional(),
});
export type ImageGenOutput = z.infer<typeof ImageGenOutputSchema>;

// ─── Public API ──────────────────────────────────────────────────────────
/**
 * Generate images from a text prompt. Returns a Result so callers must
 * handle errors explicitly. Used by the planner (block illustrations) and
 * the units page (cover art) and the chat ("create an image of..." command).
 */
export async function generateImage(
  input: ImageGenInput,
): Promise<Result<ImageGenOutput, AiError>> {
  const parsed = ImageGenInputSchema.safeParse(input);
  if (!parsed.success) {
    return Err({ kind: 'parse', message: parsed.error.message });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Err({ kind: 'config', message: 'MINIMAX_API_KEY is not set in the environment.' });
  }

  let response: Response;
  try {
    response = await fetch(IMAGE_GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        prompt: parsed.data.prompt,
        size: parsed.data.size,
        n: parsed.data.count,
      }),
    });
  } catch (error) {
    return Err({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }

  if (response.status === 429) {
    return Err({ kind: 'rate_limit', message: 'Rate limited by the image gateway.' });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    return Err({ kind: 'upstream', status: response.status, message: text });
  }

  // OpenAI-style response shape: { data: [{ url }, ...] }.
  // TODO: verify this matches the actual MiniMax image gateway response.
  const json = (await response.json()) as {
    data?: Array<{ url?: string; revised_prompt?: string }>;
  };
  const urls = (json.data ?? [])
    .map((entry) => entry.url)
    .filter((url): url is string => typeof url === 'string');

  if (urls.length === 0) {
    return Err({ kind: 'parse', message: 'No image URLs in upstream response.' });
  }

  return Ok({
    urls,
    ...(json.data?.[0]?.revised_prompt !== undefined
      ? { revisedPrompt: json.data[0].revised_prompt }
      : {}),
  });
}
