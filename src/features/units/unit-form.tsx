'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useProfile } from '@/lib/use-profile';

type UnitFormProps = {
  initialTopic: string;
  initialWeeks: number;
  initialLessonsPerWeek: number;
  isBusy: boolean;
  onSubmit: (topic: string, weeks: number, lessonsPerWeek: number) => void;
};

const PRESET_TOPICS: readonly { label: string; topic: string }[] = [
  {
    label: 'Fractions',
    topic: 'Fractions: halves, quarters, eighths across two weeks',
  },
  {
    label: 'Persuasive writing',
    topic: 'Persuasive writing: structure and emotive language',
  },
  {
    label: 'Earth science',
    topic: 'Earth science: water cycle with hands-on demos',
  },
  {
    label: 'First Nations',
    topic: 'First Nations histories: seasons and Country',
  },
];

const WEEKS = [2, 3, 4, 5] as const;
const LESSONS = [2, 3, 4, 5] as const;

function profileContextLine(
  name: string,
  yearLevel: string,
  subject: string,
  state: string,
): string {
  const parts: string[] = [];
  if (yearLevel) parts.push(yearLevel);
  if (subject) parts.push(subject);
  const head = parts.length > 0 ? parts.join(' ') : 'Class context';
  const tail = state ? ` · ${state}` : '';
  return `Context: ${head}${tail} · (${name}) teacher.`;
}

export function UnitForm({
  initialTopic,
  initialWeeks,
  initialLessonsPerWeek,
  isBusy,
  onSubmit,
}: UnitFormProps) {
  const { profile } = useProfile();
  const [topic, setTopic] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTopic = new URLSearchParams(window.location.search).get('topic');
      if (urlTopic) return urlTopic;
    }
    return initialTopic;
  });
  const [weeks, setWeeks] = useState<number>(initialWeeks || 4);
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(initialLessonsPerWeek || 3);
  const [focused, setFocused] = useState(false);

  const hasContent = topic.trim().length > 0;
  const rows = focused || hasContent ? 4 : 1;

  const contextHint = profile.name
    ? profileContextLine(
        profile.name,
        profile.yearLevel ?? '',
        profile.subject ?? '',
        profile.state ?? '',
      )
    : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim()) return;
    onSubmit(topic.trim(), weeks, lessonsPerWeek);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (isBusy || !topic.trim()) return;
      onSubmit(topic.trim(), weeks, lessonsPerWeek);
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
        <label htmlFor="unit-topic" className="text-fg text-caption font-medium">
          Unit topic or focus
        </label>
      </div>
      <textarea
        id="unit-topic"
        value={topic}
        onChange={(event) => setTopic(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Fractions: halves, quarters, eighths across two weeks"
        rows={rows}
        disabled={isBusy}
        className="text-fg placeholder:text-fg-subtle w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none disabled:opacity-50"
      />

      {contextHint && (
        <p className="text-fg-subtle mx-3 mb-1.5 text-[11px] italic">{contextHint}</p>
      )}

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

      <div className="grid grid-cols-1 gap-3 px-1 py-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-caption font-medium">Duration (weeks)</span>
          <div className="flex flex-wrap gap-1.5">
            {WEEKS.map((value) => {
              const isActive = weeks === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWeeks(value)}
                  disabled={isBusy}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-subtle bg-surface text-fg-muted hover:text-fg'
                  }`}
                >
                  {value} weeks
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-caption font-medium">Lessons per week</span>
          <div className="flex flex-wrap gap-1.5">
            {LESSONS.map((value) => {
              const isActive = lessonsPerWeek === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLessonsPerWeek(value)}
                  disabled={isBusy}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-subtle bg-surface text-fg-muted hover:text-fg'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
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
          {isBusy ? 'Generating…' : 'Generate unit'}
        </button>
      </div>
    </form>
  );
}
