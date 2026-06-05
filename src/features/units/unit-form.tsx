'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type UnitFormProps = {
  initialTopic: string;
  initialWeeks: number;
  initialLessonsPerWeek: number;
  isBusy: boolean;
  onSubmit: (topic: string, weeks: number, lessonsPerWeek: number) => void;
};

const PRESET_TOPICS: readonly string[] = [
  'Fractions: halves, quarters, eighths across two weeks',
  'Persuasive writing: structure and emotive language',
  'Earth science: water cycle with hands-on demos',
  'First Nations histories: seasons and Country',
];

const WEEKS = [2, 3, 4, 5] as const;
const LESSONS = [2, 3, 4, 5] as const;

export function UnitForm({
  initialTopic,
  initialWeeks,
  initialLessonsPerWeek,
  isBusy,
  onSubmit,
}: UnitFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [weeks, setWeeks] = useState<number>(initialWeeks || 4);
  const [lessonsPerWeek, setLessonsPerWeek] = useState<number>(initialLessonsPerWeek || 3);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim()) return;
    onSubmit(topic.trim(), weeks, lessonsPerWeek);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Unit topic or focus</span>
        <textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="e.g. Fractions: halves, quarters, eighths across two weeks"
          rows={2}
          disabled={isBusy}
          className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full resize-y rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-sm font-medium">Duration (weeks)</span>
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
          <span className="text-fg text-sm font-medium">Lessons per week</span>
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
          {isBusy ? 'Generating…' : 'Generate unit'}
        </button>
      </div>
    </form>
  );
}
