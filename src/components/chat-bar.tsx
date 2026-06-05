'use client';

import { Bot, Plus, Send, Sparkles, Square, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAgentChat } from '@/lib/use-agent-chat';

export function ChatBar() {
  const { messages, status, error, sendMessage, stop, reset } = useAgentChat();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isBusy = status === 'sending' || status === 'streaming';
  const isEmpty = messages.length === 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !draft.trim()) return;
    const text = draft;
    setDraft('');
    await sendMessage(text);
  }

  return (
    <aside className="bg-surface border-border-subtle hidden w-80 shrink-0 border-r md:flex md:flex-col">
      <div className="border-border-subtle flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent h-4 w-4" />
          <span className="text-fg text-sm font-semibold">Teaching Assistant</span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="border-border-subtle bg-surface-raised hover:bg-bg text-fg-muted flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
          aria-label="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <div className="border-border-subtle bg-surface-raised flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
            <Sparkles className="text-accent mb-3 h-6 w-6" />
            <p className="text-fg text-sm font-medium">Ask me anything</p>
            <p className="text-fg-muted mt-1 text-xs leading-relaxed">
              Lesson plans, rubrics, parent emails, sub plans, differentiation, quizzes.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <li
                key={`${message.role}-${index}`}
                className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    message.role === 'user' ? 'bg-accent text-accent-fg' : 'bg-surface-raised'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="text-accent h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-accent text-accent-fg'
                      : 'bg-surface-raised text-fg'
                  }`}
                >
                  {message.content || <span className="text-fg-subtle italic">Thinking…</span>}
                </div>
              </li>
            ))}
          </ol>
        )}

        {error && (
          <div className="border-danger/30 bg-danger/10 text-danger mt-4 rounded-lg border px-3 py-2 text-xs">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-border-subtle border-t p-3">
        <div className="border-border-subtle bg-surface-raised flex items-end gap-2 rounded-lg border p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask the teaching assistant…"
            rows={1}
            disabled={isBusy}
            className="text-fg placeholder:text-fg-subtle flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none disabled:opacity-50"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop generating"
              className="bg-surface-raised text-fg border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="bg-accent text-accent-fg flex h-8 w-8 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-fg-subtle mt-2 px-1 text-[10px]">
          {status === 'streaming' ? 'Streaming…' : 'Press Enter to send, Shift+Enter for newline.'}
        </p>
      </form>
    </aside>
  );
}
