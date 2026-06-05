'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type PlannerFormProps = {
  initialTopic: string;
  initialDuration: string;
  isBusy: boolean;
  onSubmit: (topic: string, duration: string) => void;
};

const PRESET_TOPICS: readonly string[] = [
  'Fractions: equivalent fractions on a number line',
  'Persuasive writing: structure and emotive language',
  'Earth science: water cycle with a hands-on demo',
  'Australian Curriculum HASS: First Nations seasons',
];

const DURATIONS = ['30 minutes', '45 minutes', '60 minutes', '90 minutes'] as const;

export function PlannerForm({ initialTopic, initialDuration, isBusy, onSubmit }: PlannerFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [duration, setDuration] = useState(initialDuration || '60 minutes');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim()) return;
    onSubmit(topic.trim(), duration.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Topic or focus</span>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Fractions: equivalent fractions on a number line"
          rows={2}
          disabled={isBusy}
          className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full resize-y rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Lesson duration</span>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((option) => {
            const isActive = duration === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                disabled={isBusy}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  isActive
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border-subtle bg-surface text-fg-muted hover:text-fg'
                }`}
              >
                {option}
              </button>
            );
          })}
          <input
            type="text"
            value={DURATIONS.includes(duration as (typeof DURATIONS)[number]) ? '' : duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="Custom (e.g. 75 minutes)"
            disabled={isBusy}
            className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-44 rounded-md border px-2.5 py-1.5 text-xs transition-colors outline-none disabled:opacity-50"
          />
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
          {isBusy ? 'Generating…' : 'Generate plan'}
        </button>
      </div>
    </form>
  );
}
