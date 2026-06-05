import { z } from 'zod';
import { Err, Ok, type Result, type AiError } from '@/lib/ai';

// ─── Config ───────────────────────────────────────────────────────────────
const TTS_GATEWAY = process.env.MINIMAX_TTS_URL ?? 'https://api.minimax.io/v1/t2a_v2';
const DEFAULT_TTS_MODEL = process.env.MINIMAX_TTS_MODEL ?? 'speech-2.8-hd';

const DEFAULT_VOICE_ID = 'English_expressive_narrator';

// ─── TTS (Text → Speech) ──────────────────────────────────────────────────
export const TtsInputSchema = z.object({
  text: z.string().min(1).max(8000),
  voiceId: z.string().default(DEFAULT_VOICE_ID),
  format: z.enum(['mp3', 'wav']).default('mp3'),
  speed: z.number().min(0.5).max(2).default(1),
  sampleRate: z.number().int().min(8000).max(44100).default(32000),
  languageBoost: z.string().default('auto'),
});
export type TtsInput = z.infer<typeof TtsInputSchema>;

export const TtsOutputSchema = z.object({
  audioUrl: z.string().url(),
  durationMs: z.number().optional(),
});
export type TtsOutput = z.infer<typeof TtsOutputSchema>;

/**
 * Convert text to speech. Returns a URL the client can play.
 * Used by the chat bar to read AI responses aloud, and by the planner
 * to read lesson plans aloud.
 *
 * MiniMax speech-2.8-hd: `https://api.minimax.io/v1/t2a_v2`. Response
 * shape is `{ data: { audio: "<hex>" }, extra_info: { audio_length } }`.
 * We hex-decode the audio and return it as a data: URL the client can play.
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
        text: parsed.data.text,
        stream: false,
        language_boost: parsed.data.languageBoost,
        output_format: 'hex',
        voice_setting: {
          voice_id: parsed.data.voiceId,
          speed: parsed.data.speed,
          vol: 1,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: parsed.data.sampleRate,
          bitrate: 128000,
          format: parsed.data.format,
          channel: 1,
        },
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

  const json = (await response.json()) as {
    data?: { audio?: string };
    extra_info?: { audio_length?: number };
    base_resp?: { status_code?: number; status_msg?: string };
  };

  if (json.base_resp?.status_code !== undefined && json.base_resp.status_code !== 0) {
    return Err({
      kind: 'upstream',
      status: json.base_resp.status_code,
      message: json.base_resp.status_msg ?? 'TTS gateway returned non-zero status.',
    });
  }

  const hexAudio = json.data?.audio;
  if (typeof hexAudio !== 'string' || hexAudio.length === 0) {
    return Err({ kind: 'parse', message: 'No audio in TTS response.' });
  }

  const audioBuffer = Buffer.from(hexAudio, 'hex');
  const base64 = audioBuffer.toString('base64');
  const mime = parsed.data.format === 'mp3' ? 'audio/mpeg' : `audio/${parsed.data.format}`;
  const audioUrl = `data:${mime};base64,${base64}`;

  const result: TtsOutput = { audioUrl };
  if (typeof json.extra_info?.audio_length === 'number') {
    result.durationMs = json.extra_info.audio_length;
  }
  return Ok(result);
}

// ─── STT (Speech → Text) ──────────────────────────────────────────────────
// STT is deferred: MiniMax has no public STT endpoint. When/if we add one
// (or pick a third-party like Whisper), wire it up here. For now, every
// call returns a config error so callers can degrade gracefully.
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

export async function transcribeSpeech(input: SttInput): Promise<Result<SttOutput, AiError>> {
  const parsed = SttInputSchema.safeParse(input);
  if (!parsed.success) {
    return Err({ kind: 'parse', message: parsed.error.message });
  }
  return Err({
    kind: 'config',
    message: 'STT is not configured. MiniMax has no public STT endpoint as of 2026-06-05.',
  });
}
