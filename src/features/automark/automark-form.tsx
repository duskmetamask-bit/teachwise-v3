'use client';

import { Loader2, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Rubric } from '@/lib/ai/prompts/rubric';

type AutomarkFormProps = {
  availableRubric: Rubric | null;
  isBusy: boolean;
  onSubmit: (input: {
    topic: string;
    rubric: Rubric | null;
    studentName: string;
    studentWork: string;
  }) => void;
};

const SAMPLE_WORK =
  'Schools should have uniforms because they make everyone feel equal and stop people from being judged for what they wear. Uniforms also save parents money and time in the morning. Some people say uniforms stop you from showing who you are, but I think you can still do that with your bag or shoes. On the other hand, uniforms can be uncomfortable in summer and expensive to replace. Overall, I think uniforms are a good idea because they bring everyone together.';

const PRESET_TOPICS: readonly string[] = [
  'Persuasive writing: position, structure, and persuasive devices',
  'Fractions: reasoning with equivalent fractions',
  'Science investigation: planning and concluding',
  'Oral presentation: clarity and audience engagement',
];

export function AutomarkForm({ availableRubric, isBusy, onSubmit }: AutomarkFormProps) {
  const [topic, setTopic] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [useRubric, setUseRubric] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isBusy || !topic.trim() || !studentWork.trim()) return;
    onSubmit({
      topic: topic.trim(),
      rubric: useRubric && availableRubric ? availableRubric : null,
      studentName: studentName.trim(),
      studentWork: studentWork.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-sm font-medium">Assessment focus</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="e.g. Persuasive writing"
            disabled={isBusy}
            className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-sm font-medium">Student name (optional)</span>
          <input
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="e.g. Sam K."
            disabled={isBusy}
            className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none disabled:opacity-50"
          />
        </label>
      </div>

      {availableRubric && (
        <label className="border-accent/20 bg-accent-soft flex items-start gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            checked={useRubric}
            onChange={(event) => setUseRubric(event.target.checked)}
            disabled={isBusy}
            className="text-accent mt-0.5 h-4 w-4 rounded"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-sm font-medium">
              Mark against latest rubric from <span className="text-accent">/rubric</span>
            </span>
            <span className="text-fg-muted text-xs">
              {availableRubric.title} · {availableRubric.criteria.length} criteria ·{' '}
              {availableRubric.levels.length} levels
            </span>
          </div>
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-fg text-sm font-medium">Student work</span>
        <textarea
          value={studentWork}
          onChange={(event) => setStudentWork(event.target.value)}
          placeholder="Paste the student's work here…"
          rows={10}
          disabled={isBusy}
          className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full resize-y rounded-md border px-3 py-2 font-mono text-xs leading-relaxed transition-colors outline-none disabled:opacity-50"
        />
      </label>

      <div className="border-border-subtle bg-bg text-fg-muted flex items-start gap-2 rounded-md border px-3 py-2 text-[11px]">
        <ShieldCheck className="text-success h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="text-fg">Privacy:</strong> student work is sent to the AI and discarded
          on the server. Only the feedback is saved locally in your browser.
        </span>
      </div>

      <div className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="text-fg-muted flex flex-wrap items-center gap-1.5 text-xs">
          <Sparkles className="text-accent h-3 w-3 shrink-0" />
          <span className="mr-1">Try:</span>
          {PRESET_TOPICS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setTopic(preset);
                if (!studentWork.trim()) setStudentWork(SAMPLE_WORK);
              }}
              disabled={isBusy}
              className="border-border-subtle bg-surface text-fg-muted hover:text-fg rounded-full border px-2.5 py-0.5 text-[11px] transition-colors disabled:opacity-50"
            >
              {preset.split(':')[0]}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={isBusy || !topic.trim() || !studentWork.trim()}
          className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {isBusy ? 'Marking…' : 'Mark work'}
        </button>
      </div>
    </form>
  );
}
