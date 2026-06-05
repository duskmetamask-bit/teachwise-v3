'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type RubricFormProps = {
  initialTopic: string;
  initialLevelCount: number;
  isBusy: boolean;
  onSubmit: (topic: string, levelCount: number) => void;
};

const PRESET_TOPICS: readonly string[] = [
  'Persuasive writing: structure and emotive language',
  'Fractions: reasoning with equivalent fractions',
  'Science investigation: planning and concluding',
  'Oral presentation: clarity and audience engagement',
];

const LEVEL_COUNTS = [3, 4, 5] as const;

export function RubricForm({ initialTopic, initialLevelCount, isBusy, onSubmit }: RubricFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [levelCount, setLevelCount] = useState<number>(initialLevelCount || 4);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim()) return;
    onSubmit(topic.trim(), levelCount);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Assessment focus</span>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Persuasive writing: structure and emotive language"
          rows={2}
          disabled={isBusy}
          className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full resize-y rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Number of levels</span>
        <div className="flex flex-wrap gap-1.5">
          {LEVEL_COUNTS.map((value) => {
            const isActive = levelCount === value;
            const label =
              value === 3
                ? '3 — Beginning / Developing / Extending'
                : value === 4
                  ? '4 — Beginning / Developing / Proficient / Extending'
                  : '5 — Beginning → Extending';
            return (
              <button
                key={value}
                type="button"
                onClick={() => setLevelCount(value)}
                disabled={isBusy}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  isActive
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-surface text-fg-muted hover:text-fg'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="text-fg-muted flex flex-wrap items-center gap-1.5 text-xs">
          <Sparkles className="text-accent h-3 w-3 shrink-0" />
          <span className="mr-1">Try:</span>
          {PRESET_TOPICS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTopic(preset)}
              disabled={isBusy}
              className="border-border-subtle bg-surface text-fg-muted hover:text-fg rounded-full border px-2.5 py-0.5 text-[11px] transition-colors disabled:opacity-50"
            >
              {preset.split(':')[0]}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isBusy || !topic.trim()}
          className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {isBusy ? 'Generating…' : 'Generate rubric'}
        </button>
      </div>
    </form>
  );
}
