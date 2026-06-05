'use client';

import { Send, Square } from 'lucide-react';
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isBusy || !value.trim()) return;
        onSubmit();
      }}
      className="border-border-subtle bg-surface-raised rounded-xl border p-2"
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!isBusy && value.trim()) onSubmit();
          }
        }}
        placeholder={placeholder}
        rows={1}
        disabled={isBusy}
        className="text-fg placeholder:text-fg-subtle w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none disabled:opacity-50"
      />
      <div className="mt-1 flex items-center justify-between px-1">
        <p className="text-fg-subtle text-[10px]">
          {isBusy ? 'Streaming…' : 'Press Enter to send, Shift+Enter for newline.'}
        </p>
        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="border-border bg-bg text-fg flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
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
