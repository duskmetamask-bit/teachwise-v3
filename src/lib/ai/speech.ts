import { z } from 'zod';
import { Err, Ok, type Result, type AiError } from '@/lib/ai';

// ─── Config ───────────────────────────────────────────────────────────────
// TODO: confirm the MiniMax TTS + STT endpoints. v2 had no speech wiring.
// Placeholder structure — fill in once you have the real URLs.
const TTS_GATEWAY = process.env.MINIMAX_TTS_URL ?? 'https://api.minimax.io/v1/audio/speech';
const STT_GATEWAY = process.env.MINIMAX_STT_URL ?? 'https://api.minimax.io/v1/audio/transcriptions';
const DEFAULT_TTS_MODEL = process.env.MINIMAX_TTS_MODEL ?? 'MiniMax-TTS-01';
const DEFAULT_STT_MODEL = process.env.MINIMAX_STT_MODEL ?? 'MiniMax-STT-01';

// ─── TTS (Text → Speech) ──────────────────────────────────────────────────
export const TtsInputSchema = z.object({
  text: z.string().min(1).max(8000),
  voice: z.string().default('alloy'),
  format: z.enum(['mp3', 'wav', 'opus']).default('mp3'),
  speed: z.number().min(0.25).max(4).default(1),
});
export type TtsInput = z.infer<typeof TtsInputSchema>;

export const TtsOutputSchema = z.object({
  audioUrl: z.string().url(),
  durationSeconds: z.number().optional(),
});
export type TtsOutput = z.infer<typeof TtsOutputSchema>;

/**
 * Convert text to speech. Returns a URL the client can play.
 * Used by the chat bar to read AI responses aloud, and by the planner
 * to read lesson plans aloud.
 */
export async function synthesizeSpeech(input: TtsInput): Promise<Result<TtsOutput, AiError>> {
  const parsed = TtsInputSchema.safeParse(input);
  if (!parsed.success) {
    return Err({ kind: 'parse', message: parsed.error.message });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Err({ kind: 'config', message: 'MINIMAX_API_KEY is not set in the environment.' });
  }

  let response: Response;
  try {
    response = await fetch(TTS_GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_TTS_MODEL,
        input: parsed.data.text,
        voice: parsed.data.voice,
        response_format: parsed.data.format,
        speed: parsed.data.speed,
      }),
    });
  } catch (error) {
    return Err({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }

  if (response.status === 429) {
    return Err({ kind: 'rate_limit', message: 'Rate limited by the TTS gateway.' });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    return Err({ kind: 'upstream', status: response.status, message: text });
  }

  // OpenAI-style response: returns binary audio directly. In a server context
  // we need to either proxy it or upload to storage. For now, return a
  // data: URL with the base64 audio so the client can play it directly.
  // TODO: once a real MiniMax TTS gateway exists, swap to returning a hosted URL.
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mime = parsed.data.format === 'mp3' ? 'audio/mpeg' : `audio/${parsed.data.format}`;
  const audioUrl = `data:${mime};base64,${base64}`;

  return Ok({ audioUrl });
}

// ─── STT (Speech → Text) ──────────────────────────────────────────────────
export const SttInputSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default('audio/webm'),
  language: z.string().default('en'),
});
export type SttInput = z.infer<typeof SttInputSchema>;

export const SttOutputSchema = z.object({
  text: z.string(),
});
export type SttOutput = z.infer<typeof SttOutputSchema>;

/**
 * Convert speech audio to text. Used by the chat bar (voice input for
 * messages) and the planner (voice input for block content).
 */
export async function transcribeSpeech(input: SttInput): Promise<Result<SttOutput, AiError>> {
  const parsed = SttInputSchema.safeParse(input);
  if (!parsed.success) {
    return Err({ kind: 'parse', message: parsed.error.message });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Err({ kind: 'config', message: 'MINIMAX_API_KEY is not set in the environment.' });
  }

  // Convert base64 → Buffer → Blob for multipart/form-data.
  const audioBuffer = Buffer.from(parsed.data.audioBase64, 'base64');
  const form = new FormData();
  form.append('model', DEFAULT_STT_MODEL);
  form.append('language', parsed.data.language);
  form.append('file', new Blob([audioBuffer], { type: parsed.data.mimeType }), 'audio.webm');

  let response: Response;
  try {
    response = await fetch(STT_GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });
  } catch (error) {
    return Err({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }

  if (response.status === 429) {
    return Err({ kind: 'rate_limit', message: 'Rate limited by the STT gateway.' });
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    return Err({ kind: 'upstream', status: response.status, message: text });
  }

  // OpenAI-style response: { text: "..." }
  const json = (await response.json()) as { text?: string };
  if (typeof json.text !== 'string') {
    return Err({ kind: 'parse', message: 'No text in STT response.' });
  }

  return Ok({ text: json.text });
}
