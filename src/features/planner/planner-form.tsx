'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

type PlannerFormProps = {
  initialTopic: string;
  initialDuration: string;
  isBusy: boolean;
  onSubmit: (topic: string, duration: string) => void;
};

const PRESET_TOPICS: readonly { label: string; topic: string }[] = [
  {
    label: 'Fractions',
    topic: 'Fractions: equivalent fractions on a number line',
  },
  {
    label: 'Persuasive writing',
    topic: 'Persuasive writing: structure and emotive language',
  },
  {
    label: 'Earth science',
    topic: 'Earth science: water cycle with a hands-on demo',
  },
  {
    label: 'HASS',
    topic: 'Australian Curriculum HASS: First Nations seasons',
  },
];

const DURATIONS = ['30 minutes', '45 minutes', '60 minutes', '90 minutes'] as const;

export function PlannerForm({ initialTopic, initialDuration, isBusy, onSubmit }: PlannerFormProps) {
  const [topic, setTopic] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTopic = new URLSearchParams(window.location.search).get('topic');
      if (urlTopic) return urlTopic;
    }
    return initialTopic;
  });
  const [duration, setDuration] = useState(initialDuration || '60 minutes');
  const [focused, setFocused] = useState(false);

  const hasContent = topic.trim().length > 0;
  const rows = focused || hasContent ? 4 : 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim()) return;
    onSubmit(topic.trim(), duration.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (isBusy || !topic.trim()) return;
      onSubmit(topic.trim(), duration.trim());
    }
  }

  function pickPreset(value: string): void {
    if (isBusy) return;
    setTopic(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-border bg-surface-raised rounded-xl border p-2 transition-all duration-(--duration-fast) ease-(--ease-out) ${
        focused ? 'border-accent shadow-sm' : ''
      }`}
    >
      <div className="px-1 pt-1">
        <label htmlFor="planner-topic" className="text-fg text-caption font-medium">
          Topic or focus
        </label>
      </div>
      <textarea
        id="planner-topic"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Fractions: equivalent fractions on a number line"
        rows={rows}
        disabled={isBusy}
        className="text-fg placeholder:text-fg-subtle w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none disabled:opacity-50"
      />

      <div className="flex flex-wrap items-center gap-1.5 px-2 pb-1.5">
        <span className="text-fg-subtle text-caption flex items-center gap-1">
          <Sparkles className="text-accent h-3 w-3 shrink-0" />
          Try:
        </span>
        {PRESET_TOPICS.map((preset) => {
          const isActive = topic === preset.topic;
          return (
            <button
              key={preset.topic}
              type="button"
              onClick={() => pickPreset(preset.topic)}
              disabled={isBusy}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-subtle bg-surface text-fg-muted hover:text-fg'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="border-border-subtle mx-1 border-t" />

      <div className="flex flex-col gap-1.5 px-1 py-2">
        <span className="text-fg text-caption font-medium">Lesson duration</span>
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

      <div className="border-border-subtle mx-1 border-t" />

      <div className="flex items-center justify-between gap-2 px-1 py-2">
        <p className="text-fg-subtle text-caption">
          {isBusy ? 'Generating…' : 'Press ⌘+Enter to generate'}
        </p>
        <button
          type="submit"
          disabled={isBusy || !topic.trim()}
          className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {isBusy ? 'Generating…' : 'Generate plan'}
        </button>
      </div>
    </form>
  );
}
