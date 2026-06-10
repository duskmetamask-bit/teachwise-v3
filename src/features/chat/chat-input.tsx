'use client';

import { Send, Square } from 'lucide-react';
import { useRef, useState } from 'react';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isBusy: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isBusy,
  placeholder = 'Ask the teaching assistant…',
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const hasContent = value.trim().length > 0;
  const rows = focused || hasContent ? 4 : 1;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isBusy || !value.trim()) return;
        onSubmit();
      }}
      className={`border-border bg-surface-raised rounded-xl border p-2 transition-all duration-(--duration-fast) ease-(--ease-out) ${
        focused ? 'border-accent shadow-sm' : ''
      }`}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            if (!isBusy && value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        rows={rows}
        disabled={isBusy}
        aria-label="Message"
        className="text-fg placeholder:text-fg-subtle w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none disabled:opacity-50"
      />
      <div className="mt-1 flex items-center justify-between px-1">
        <p className="text-fg-subtle text-caption">
          {isBusy ? 'Streaming…' : 'Press ⌘+Enter to send · Enter for newline'}
        </p>
        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="border-border bg-bg text-fg text-caption flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium"
          >
            <Square className="h-3 w-3" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="Send message"
            className="bg-accent text-accent-fg flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
