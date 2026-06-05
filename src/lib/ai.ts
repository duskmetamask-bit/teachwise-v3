import { z } from 'zod';

// ─── Result type ──────────────────────────────────────────────────────────
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ─── AI errors ────────────────────────────────────────────────────────────
export type AiError =
  | { kind: 'config'; message: string }
  | { kind: 'rate_limit'; message: string }
  | { kind: 'upstream'; status: number; message: string }
  | { kind: 'parse'; message: string }
  | { kind: 'network'; message: string };

// ─── Schemas (Zod at the boundaries) ─────────────────────────────────────
export const RoleSchema = z.enum(['user', 'assistant', 'system']);
export type Role = z.infer<typeof RoleSchema>;

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const TeacherPrefsSchema = z.object({
  name: z.string().optional(),
  yearLevel: z.string().optional(),
  subject: z.string().optional(),
  state: z.string().optional(),
  classContext: z.string().optional(),
});
export type TeacherPrefs = z.infer<typeof TeacherPrefsSchema>;

export const GenerateTextInputSchema = z.object({
  system: z.string().min(1),
  messages: z.array(MessageSchema).min(1),
  maxTokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
});
export type GenerateTextInput = z.infer<typeof GenerateTextInputSchema>;

// ─── Anthropic-format response ────────────────────────────────────────────
// Lifted shape from M2.7 (api.minimax.io) — what M3 returns.
const AnthropicResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string().optional(),
    }),
  ),
});

// ─── Config ───────────────────────────────────────────────────────────────
const ANTHROPIC_GATEWAY = 'https://api.minimax.io/anthropic/v1/messages';
const DEFAULT_MODEL = 'MiniMax-M3';
const DEFAULT_MAX_TOKENS = 4096;

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Single text generation call to the M3 model on the Anthropic-format gateway.
 * Returns a Result so callers must handle errors explicitly.
 */
export async function generateText(input: GenerateTextInput): Promise<Result<string, AiError>> {
  const parsed = GenerateTextInputSchema.safeParse(input);
  if (!parsed.success) {
    return Err({ kind: 'parse', message: parsed.error.message });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Err({ kind: 'config', message: 'MINIMAX_API_KEY is not set in the environment.' });
  }

  const body = {
    model: DEFAULT_MODEL,
    max_tokens: parsed.data.maxTokens ?? DEFAULT_MAX_TOKENS,
    ...(parsed.data.temperature !== undefined ? { temperature: parsed.data.temperature } : {}),
    system: parsed.data.system,
    messages: parsed.data.messages,
  };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_GATEWAY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return Err({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }

  if (response.status === 429) {
    return Err({ kind: 'rate_limit', message: 'Rate limited by the AI gateway.' });
  }

  if (!response.ok) {
    const text = await response.text();
    return Err({ kind: 'upstream', status: response.status, message: text });
  }

  const json = await response.json();
  const parsedBody = AnthropicResponseSchema.safeParse(json);
  if (!parsedBody.success) {
    return Err({ kind: 'parse', message: parsedBody.error.message });
  }

  const text = parsedBody.data.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n\n');

  if (!text) {
    return Err({ kind: 'parse', message: 'No text content in AI response.' });
  }

  return Ok(text);
}

/**
 * Stream text from M3. Returns a Response object with a ReadableStream of
 * text deltas. Used by the chat bar to render tokens as they arrive.
 */
export function streamText(input: GenerateTextInput): Response {
  const parsed = GenerateTextInputSchema.safeParse(input);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'MINIMAX_API_KEY is not set in the environment.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = {
    model: DEFAULT_MODEL,
    max_tokens: parsed.data.maxTokens ?? DEFAULT_MAX_TOKENS,
    ...(parsed.data.temperature !== undefined ? { temperature: parsed.data.temperature } : {}),
    system: parsed.data.system,
    messages: parsed.data.messages,
    stream: true,
  };

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let upstream: Response;
      try {
        upstream = await fetch(ANTHROPIC_GATEWAY, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown network error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ kind: 'network', message })}\n\n`),
        );
        controller.close();
        return;
      }

      if (!upstream.ok || !upstream.body) {
        const text = await upstream.text().catch(() => 'unknown');
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ kind: 'upstream', status: upstream.status, message: text })}\n\n`,
          ),
        );
        controller.close();
        return;
      }

      const reader = upstream.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Anthropic SSE format: events separated by \n\n, each line "key: value".
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) {
            boundary = buffer.indexOf('\n\n');
            continue;
          }

          const payload = dataLine.slice(5).trim();
          if (payload === '[DONE]') {
            controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
            controller.close();
            return;
          }

          try {
            const event = JSON.parse(payload) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(
                encoder.encode(
                  `event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`,
                ),
              );
            }
          } catch {
            // Ignore non-JSON lines; some gateways send comments.
          }

          boundary = buffer.indexOf('\n\n');
        }
      }

      controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
