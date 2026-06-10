'use client';

import { ArrowLeft, ClipboardList, Download, Loader2, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { RubricForm, RubricHeader, RubricTable, exportRubricAsDocx } from '@/features/rubric';
import type { Rubric, RubricCriterion } from '@/lib/ai/prompts/rubric';
import { useProfile } from '@/lib/use-profile';
import { useRubric } from '@/lib/use-rubric';
import { FadeIn, FadeInDown, FadeInUp, Pulse } from '@/components/ui/motion';

type Status = 'idle' | 'generating' | 'error';
type BusyKind = 'generate' | 'criterion';

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

export default function RubricPage() {
  const { profile } = useProfile();
  const { state, setMeta, setRubric, replaceCriterion, setDescriptor, clear } = useRubric();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [busyCriterionId, setBusyCriterionId] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<BusyKind | null>(null);

  const handleGenerate = useCallback(
    async (topic: string, levelCount: number) => {
      setStatus('generating');
      setError(null);
      setMeta({ topic, levelCount });
      try {
        const { rubric } = await postJson<{ rubric: Rubric }>('/api/agent/rubric', {
          action: 'generate',
          topic,
          levelCount,
          teacherPrefs: profile,
        });
        setRubric(rubric);
        setStatus('idle');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to generate rubric.');
        setStatus('error');
      }
    },
    [profile, setMeta, setRubric],
  );

  const handleRegenerateCriterion = useCallback(
    async (criterion: RubricCriterion) => {
      if (!state.rubric) throw new Error('No rubric to regenerate within.');
      setBusyCriterionId(criterion.id);
      setBusyKind('criterion');
      try {
        const { criterion: next } = await postJson<{ criterion: RubricCriterion }>(
          '/api/agent/rubric',
          {
            action: 'regenerate-criterion',
            topic: state.topic,
            levelCount: state.levelCount,
            rubric: state.rubric,
            targetCriterionId: criterion.id,
            teacherPrefs: profile,
          },
        );
        replaceCriterion(next);
      } finally {
        setBusyCriterionId(null);
        setBusyKind(null);
      }
    },
    [profile, replaceCriterion, state.levelCount, state.rubric, state.topic],
  );

  const handleEditDescriptor = useCallback(
    (criterionId: string, levelId: string, value: string) => {
      setDescriptor(criterionId, levelId, value);
    },
    [setDescriptor],
  );

  const handleExport = useCallback(async () => {
    if (!state.rubric) return;
    await exportRubricAsDocx(state.rubric);
  }, [state.rubric]);

  const hasRubric = state.rubric !== null;
  const isBusy = status === 'generating';
  const showRegeneratingLoader = busyKind === 'criterion' && busyCriterionId;

  return (
    <div className="bg-bg flex h-full flex-col">
      <FadeInDown>
        <div className="border-border-subtle bg-surface/80 supports-[backdrop-filter]:bg-surface/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Link
                href="/"
                className="text-fg-muted hover:text-fg text-caption flex shrink-0 items-center gap-1.5 transition-colors"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <div className="bg-border-subtle h-4 w-px shrink-0" />
              <div className="bg-accent-soft text-accent text-caption flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-medium">
                <ClipboardList className="h-3 w-3" />
                Rubric builder
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href="/profile"
                className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                aria-label="Edit profile"
              >
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              {hasRubric && (
                <>
                  <button
                    type="button"
                    onClick={clear}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Clear rubric"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Export rubric as docx"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </FadeInDown>

      <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-8 sm:px-10">
        <FadeInUp>
          <div className="mb-6">
            <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
              Rubric builder
            </h1>
            <p className="text-fg-muted mt-1 text-sm">
              Criteria × levels rubrics aligned to AC9. Edit any descriptor, regenerate any
              criterion, export to docx.
            </p>
          </div>
        </FadeInUp>

        <FadeIn delay={0.05}>
          <RubricForm
            initialTopic={state.topic}
            initialLevelCount={state.levelCount}
            isBusy={isBusy}
            onSubmit={handleGenerate}
          />
        </FadeIn>

        {status === 'generating' && (
          <FadeIn className="text-fg-muted mt-6 flex items-center gap-2 text-sm">
            <Pulse>
              <Loader2 className="text-accent h-4 w-4" />
            </Pulse>
            Drafting the rubric…
          </FadeIn>
        )}

        {error && status === 'error' && (
          <FadeIn className="border-danger/30 bg-danger-soft text-danger mt-6 rounded-lg border px-4 py-3 text-sm">
            {error}
          </FadeIn>
        )}

        {hasRubric && state.rubric && (
          <FadeInUp delay={0.1} className="mt-8 flex flex-col gap-6">
            <RubricHeader rubric={state.rubric} />
            <RubricTable
              rubric={state.rubric}
              busyCriterionId={busyCriterionId}
              onEditDescriptor={handleEditDescriptor}
              onRegenerateCriterion={handleRegenerateCriterion}
            />
            {showRegeneratingLoader && (
              <p className="text-fg-muted flex items-center gap-2 text-xs">
                <Loader2 className="text-accent h-3 w-3 animate-spin" />
                Regenerating criterion…
              </p>
            )}
          </FadeInUp>
        )}

        {!hasRubric && status === 'idle' && (
          <FadeIn delay={0.2} className="text-fg-muted mt-6 text-xs">
            Stored locally in this browser. Multi-teacher isolation arrives in Phase 4 with Clerk.
          </FadeIn>
        )}
      </div>
    </div>
  );
}
