'use client';

import { Plus, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function ChatBar() {
  const [draft, setDraft] = useState('');

  return (
    <aside className="bg-surface border-border-subtle hidden w-80 shrink-0 border-r md:flex md:flex-col">
      <div className="border-border-subtle flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent h-4 w-4" />
          <span className="text-fg text-sm font-semibold">Teaching Assistant</span>
        </div>
        <button
          type="button"
          className="border-border-subtle bg-surface-raised hover:bg-bg text-fg-muted flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors"
          aria-label="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="border-border-subtle bg-surface-raised flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
          <Sparkles className="text-accent mb-3 h-6 w-6" />
          <p className="text-fg text-sm font-medium">Ask me anything</p>
          <p className="text-fg-muted mt-1 text-xs leading-relaxed">
            Lesson plans, rubrics, parent emails, sub plans, differentiation, quizzes.
          </p>
        </div>
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        className="border-border-subtle border-t p-3"
      >
        <div className="border-border-subtle bg-surface-raised flex items-end gap-2 rounded-lg border p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask the teaching assistant…"
            rows={1}
            className="text-fg placeholder:text-fg-subtle flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled
            aria-label="Send message"
            className="bg-accent text-accent-fg flex h-8 w-8 shrink-0 items-center justify-center rounded-md opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-fg-subtle mt-2 px-1 text-[10px]">
          Agent wires up in Phase 2. Input is a placeholder.
        </p>
      </form>
    </aside>
  );
}
