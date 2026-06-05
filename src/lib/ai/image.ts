import { z } from 'zod';
import { Err, Ok, type Result, type AiError } from '@/lib/ai';

// ─── Config ───────────────────────────────────────────────────────────────
const IMAGE_GATEWAY = process.env.MINIMAX_IMAGE_URL ?? 'https://api.minimax.io/v1/image_generation';
const DEFAULT_IMAGE_MODEL = process.env.MINIMAX_IMAGE_MODEL ?? 'image-01';

// ─── Schemas ──────────────────────────────────────────────────────────────
export const ImageAspectRatioSchema = z.enum([
  '1:1',
  '16:9',
  '4:3',
  '3:2',
  '2:3',
  '3:4',
  '9:16',
  '21:9',
]);
export type ImageAspectRatio = z.infer<typeof ImageAspectRatioSchema>;

export const ImageGenInputSchema = z.object({
  prompt: z.string().min(1).max(1500),
  aspectRatio: ImageAspectRatioSchema.default('1:1'),
  count: z.number().int().min(1).max(4).default(1),
  promptOptimizer: z.boolean().default(true),
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
 *
 * MiniMax image-01: `https://api.minimax.io/v1/image_generation`.
 * Returns a `data.image_urls` array of CDN URLs that expire in 24h.
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
        aspect_ratio: parsed.data.aspectRatio,
        n: parsed.data.count,
        response_format: 'url',
        prompt_optimizer: parsed.data.promptOptimizer,
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

  const json = (await response.json()) as {
    data?: { image_urls?: string[]; image_base64?: string[] };
    metadata?: { revised_prompt?: string };
  };

  const urls = (json.data?.image_urls ?? []).filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );

  if (urls.length === 0) {
    return Err({ kind: 'parse', message: 'No image URLs in upstream response.' });
  }

  const revisedPrompt = json.metadata?.revised_prompt;
  return Ok({
    urls,
    ...(typeof revisedPrompt === 'string' ? { revisedPrompt } : {}),
  });
}
