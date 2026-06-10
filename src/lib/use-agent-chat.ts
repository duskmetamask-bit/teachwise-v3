'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';
import type { Message, TeacherPrefs } from '@/lib/ai';

const SseEventSchema = z.union([
  z.object({
    type: z.literal('delta'),
    data: z.object({ text: z.string() }),
  }),
  z.object({
    type: z.literal('done'),
    data: z.object({}).optional(),
  }),
  z.object({
    type: z.literal('error'),
    data: z.object({ kind: z.string(), message: z.string() }).optional(),
  }),
]);

type ChatStatus = 'idle' | 'sending' | 'streaming' | 'error';

type UseAgentChatOptions = {
  teacherPrefs?: TeacherPrefs;
};

type UseAgentChatResult = {
  messages: Message[];
  status: ChatStatus;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  stop: () => void;
  reset: () => void;
};

export function useAgentChat({ teacherPrefs = {} }: UseAgentChatOptions = {}): UseAgentChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stop = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setStatus('idle');
  }, [abortController]);

  const reset = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, [abortController]);

  /**
   * Stream an assistant response into the *current* last assistant slot
   * (which the caller has just appended). Used by both `sendMessage` (which
   * appends a new user + assistant pair) and `retry` (which re-uses the
   * existing user message and appends only a new assistant placeholder).
   */
  const streamIntoLast = useCallback(
    async (history: Message[]) => {
      setStatus('sending');
      setError(null);

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, teacherPrefs }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        setStatus('streaming');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);

            const eventTypeLine = rawEvent.split('\n').find((line) => line.startsWith('event:'));
            const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data:'));

            if (!eventTypeLine || !dataLine) {
              boundary = buffer.indexOf('\n\n');
              continue;
            }

            const eventType = eventTypeLine.slice(6).trim();
            const dataPayload = dataLine.slice(5).trim();

            let parsedJson: unknown;
            try {
              parsedJson = JSON.parse(dataPayload);
            } catch {
              boundary = buffer.indexOf('\n\n');
              continue;
            }

            const parsedEvent = SseEventSchema.safeParse({ type: eventType, data: parsedJson });
            if (!parsedEvent.success) {
              boundary = buffer.indexOf('\n\n');
              continue;
            }

            if (parsedEvent.data.type === 'delta') {
              const delta = parsedEvent.data.data.text;
              setMessages((current) => {
                const next = [...current];
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') {
                  next[next.length - 1] = { role: 'assistant', content: last.content + delta };
                }
                return next;
              });
            } else if (parsedEvent.data.type === 'error') {
              const message =
                parsedEvent.data.data?.message ?? 'Unknown error from the AI gateway.';
              throw new Error(message);
            } else if (parsedEvent.data.type === 'done') {
              setStatus('idle');
              setAbortController(null);
              return;
            }

            boundary = buffer.indexOf('\n\n');
          }
        }

        setStatus('idle');
        setAbortController(null);
      } catch (caught) {
        if (controller.signal.aborted) {
          setStatus('idle');
          return;
        }
        const message = caught instanceof Error ? caught.message : 'Unknown error';
        setError(message);
        setStatus('error');
        setAbortController(null);
        // Roll back the empty assistant placeholder so the user sees only real content.
        setMessages((current) => {
          if (current.length === 0) return current;
          const last = current[current.length - 1];
          if (last && last.role === 'assistant' && last.content === '') {
            return current.slice(0, -1);
          }
          return current;
        });
      }
    },
    [teacherPrefs],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: Message = { role: 'user', content: trimmed };
      const assistantPlaceholder: Message = { role: 'assistant', content: '' };

      // Read the latest messages synchronously via the functional updater, then
      // build the history payload from the same source so the request includes
      // the new user turn.
      let history: Message[] = [];
      setMessages((current) => {
        history = [...current, userMessage];
        return [...current, userMessage, assistantPlaceholder];
      });
      await streamIntoLast(history);
    },
    [streamIntoLast],
  );

  const retry = useCallback(async () => {
    if (status === 'sending' || status === 'streaming') return;
    // Use the latest messages snapshot from the render closure so the
    // decision is synchronous; the alternative — reading inside a
    // `setMessages` updater — runs the updater asynchronously and the
    // `lastUser` variable stays undefined when we read it after.
    let lastUser: Message | undefined;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m && m.role === 'user') {
        lastUser = m;
        break;
      }
    }
    if (!lastUser) return;
    const truncated = messages.slice(0, messages.indexOf(lastUser) + 1);
    setMessages([...truncated, { role: 'assistant', content: '' }]);
    await streamIntoLast(truncated);
  }, [messages, status, streamIntoLast]);

  return { messages, status, error, sendMessage, retry, stop, reset };
}
