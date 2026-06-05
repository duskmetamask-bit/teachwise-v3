import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamText, type Message, type TeacherPrefs } from '@/lib/ai';
import { agentSystemPrompt } from '@/lib/ai/prompts/agent';

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
    }),
  ),
  teacherPrefs: z
    .object({
      name: z.string().optional(),
      yearLevel: z.string().optional(),
      subject: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const messages: Message[] = parsed.data.messages;
  const teacherPrefs: TeacherPrefs = parsed.data.teacherPrefs ?? {};

  // Keep the last 16 messages to bound context. Older messages get dropped.
  const trimmedMessages = messages.slice(-16);

  return streamText({
    system: agentSystemPrompt(teacherPrefs),
    messages: trimmedMessages,
    maxTokens: 4096,
  });
}
