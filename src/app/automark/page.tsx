'use client';

import { ArrowLeft, FileCheck2, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { AutomarkForm, AutomarkHistory, AutomarkResultView } from '@/features/automark';
import type { AutomarkResult } from '@/lib/ai/prompts/automark';
import type { Rubric } from '@/lib/ai/prompts/rubric';
import { useAutomark } from '@/lib/use-automark';
import { useProfile } from '@/lib/use-profile';
import { useRubric } from '@/lib/use-rubric';
import { FadeIn, FadeInUp } from '@/components/ui/motion';

type Status = 'idle' | 'marking' | 'error';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

type LastMark = {
  topic: string;
  rubricSnapshot: Rubric | null;
  studentName: string;
  feedback: AutomarkResult;
};

export default function AutomarkPage() {
  const { profile } = useProfile();
  const { state: rubricState } = useRubric();
  const { state: automarkState, addEntry, removeEntry, clear } = useAutomark();

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastMark, setLastMark] = useState<LastMark | null>(null);

  const availableRubric = rubricState.rubric;

  const handleSubmit = useCallback(
    async (input: {
      topic: string;
      rubric: Rubric | null;
      studentName: string;
      studentWork: string;
    }) => {
      setStatus('marking');
      setError(null);
      try {
        const { feedback } = await postJson<{ feedback: AutomarkResult }>('/api/agent/automark', {
          topic: input.topic,
          rubric: input.rubric,
          studentWork: input.studentWork,
          teacherPrefs: profile,
        });
        setLastMark({
          topic: input.topic,
          rubricSnapshot: input.rubric,
          studentName: input.studentName,
          feedback,
        });
        setStatus('idle');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to mark work.');
        setStatus('error');
      }
    },
    [profile],
  );

  const handleSave = useCallback(() => {
    if (!lastMark) return;
    addEntry({
      topic: lastMark.topic,
      rubricSnapshot: lastMark.rubricSnapshot,
      feedback: lastMark.feedback,
      ...(lastMark.studentName ? { studentName: lastMark.studentName } : {}),
    });
  }, [addEntry, lastMark]);

  const handleDiscard = useCallback(() => {
    setLastMark(null);
  }, []);

  const isBusy = status === 'marking';

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link
            href="/"
            className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-surface flex h-9 w-9 items-center justify-center rounded-md">
              <FileCheck2 className="text-fg h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
                Automark
              </h1>
              <p className="text-fg-muted mt-1 text-sm">
                Mark student work against a rubric. AI feedback is saved locally; the student work
                is discarded.
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/profile"
            className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
          >
            <Settings className="h-3 w-3" />
            Profile
          </Link>
        </div>
      </div>

      <FadeIn>
        <AutomarkForm availableRubric={availableRubric} isBusy={isBusy} onSubmit={handleSubmit} />
      </FadeIn>

      {status === 'marking' && (
        <FadeIn className="text-fg-muted mt-6 flex items-center gap-2 text-sm">
          <Loader2 className="text-accent h-4 w-4 animate-spin" />
          Marking the work…
        </FadeIn>
      )}

      {error && status === 'error' && (
        <FadeIn className="border-danger/30 bg-danger/10 text-danger mt-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </FadeIn>
      )}

      {lastMark && (
        <div className="mt-8">
          <AutomarkResultView
            result={lastMark.feedback}
            saved={
              // Mark as saved if any history entry references this feedback (by reference)
              automarkState.history.some(
                (e) =>
                  e.topic === lastMark.topic &&
                  e.feedback.overallLevel === lastMark.feedback.overallLevel &&
                  e.feedback.rubricTitle === lastMark.feedback.rubricTitle,
              )
            }
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
        </div>
      )}

      <FadeInUp className="mt-10">
        <AutomarkHistory
          entries={automarkState.history}
          onDelete={removeEntry}
          onClearAll={clear}
        />
      </FadeInUp>
    </div>
  );
}
