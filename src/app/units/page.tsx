'use client';

import { ArrowLeft, BookOpen, Download, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import {
  ErrorChip,
  LessonsList,
  LessonsListSkeleton,
  UnitForm,
  UnitHeader,
  exportUnitAsDocx,
} from '@/features/units';
import type { UnitLesson, UnitPlan } from '@/lib/ai/prompts/units';
import { useProfile } from '@/lib/use-profile';
import { useUnit } from '@/lib/use-unit';
import { FadeIn, FadeInDown, FadeInUp } from '@/components/ui/motion';

type Status = 'idle' | 'generating' | 'error';

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

export default function UnitsPage() {
  const { profile } = useProfile();
  const { state, setMeta, setPlan, replaceLesson, setCoverImage, clear } = useUnit();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastSubmitRef = useRef<{ topic: string; weeks: number; lessonsPerWeek: number } | null>(
    null,
  );

  const handleGenerate = useCallback(
    async (topic: string, weeks: number, lessonsPerWeek: number) => {
      setStatus('generating');
      setError(null);
      setMeta({ topic, weeks, lessonsPerWeek });
      lastSubmitRef.current = { topic, weeks, lessonsPerWeek };
      try {
        const { plan } = await postJson<{ plan: UnitPlan }>('/api/agent/unit', {
          action: 'generate',
          topic,
          weeks,
          lessonsPerWeek,
          teacherPrefs: profile,
        });
        setPlan({
          overview: plan.overview,
          ac9Codes: plan.ac9Codes,
          assessment: plan.assessment,
          differentiation: plan.differentiation,
          resources: plan.resources,
          lessons: plan.lessons,
        });
        setStatus('idle');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to generate unit.');
        setStatus('error');
      }
    },
    [profile, setMeta, setPlan],
  );

  const handleRetry = useCallback(() => {
    const last = lastSubmitRef.current;
    if (!last) return;
    void handleGenerate(last.topic, last.weeks, last.lessonsPerWeek);
  }, [handleGenerate]);

  const handleDismissError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  const handleRegenerateLesson = useCallback(
    async (lesson: UnitLesson) => {
      if (!state.plan) throw new Error('No plan to regenerate within.');
      const { lesson: next } = await postJson<{ lesson: UnitLesson }>('/api/agent/unit', {
        action: 'regenerate-lesson',
        topic: state.topic,
        weeks: state.weeks,
        lessonsPerWeek: state.lessonsPerWeek,
        lesson,
        otherLessons: state.plan.lessons.filter((l) => l.id !== lesson.id),
        teacherPrefs: profile,
      });
      replaceLesson(lesson.id, next);
    },
    [profile, replaceLesson, state.plan, state.lessonsPerWeek, state.topic, state.weeks],
  );

  const handleEditLesson = useCallback(
    (
      id: string,
      updates: { title: string; walt: string; successCriteria: string[]; body: string },
    ) => {
      replaceLesson(id, {
        id,
        weekNumber: state.plan?.lessons.find((l) => l.id === id)?.weekNumber ?? 1,
        lessonNumber: state.plan?.lessons.find((l) => l.id === id)?.lessonNumber ?? 1,
        title: updates.title,
        walt: updates.walt,
        successCriteria: updates.successCriteria,
        body: updates.body,
      });
    },
    [replaceLesson, state.plan],
  );

  const handleGenerateCover = useCallback(
    async (prompt: string) => {
      const { url } = await postJson<{ url: string }>('/api/agent/image', {
        prompt,
        aspectRatio: '21:9',
      });
      setCoverImage(url, prompt);
    },
    [setCoverImage],
  );

  const handleExport = useCallback(async () => {
    if (!state.plan) return;
    await exportUnitAsDocx({
      topic: state.topic,
      weeks: state.weeks,
      lessonsPerWeek: state.lessonsPerWeek,
      plan: state.plan,
    });
  }, [state]);

  const hasPlan = state.plan !== null && state.plan.lessons.length > 0;
  const isBusy = status === 'generating';

  return (
    <div className="bg-bg flex h-full flex-col">
      <FadeInDown>
        <div className="border-border-subtle bg-surface/80 supports-[backdrop-filter]:bg-surface/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
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
                <BookOpen className="h-3 w-3" />
                Unit planner
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
              {hasPlan && (
                <>
                  <button
                    type="button"
                    onClick={clear}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Clear all units"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Export unit as docx"
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

      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-8 sm:px-10">
        <FadeInUp>
          <div className="mb-6">
            <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
              Unit planner
            </h1>
            <p className="text-fg-muted mt-1 text-sm">
              Multi-week units aligned to AC9. Regenerate any lesson, add a cover image, export to
              docx.
            </p>
          </div>
        </FadeInUp>

        <FadeIn delay={0.05}>
          <UnitForm
            initialTopic={state.topic}
            initialWeeks={state.weeks}
            initialLessonsPerWeek={state.lessonsPerWeek}
            isBusy={isBusy}
            onSubmit={handleGenerate}
          />
        </FadeIn>

        {status === 'generating' && !hasPlan && (
          <FadeInUp delay={0.1} className="mt-8">
            <LessonsListSkeleton count={4} />
          </FadeInUp>
        )}

        {error && status === 'error' && (
          <ErrorChip
            message={error}
            disabled={isBusy}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}

        {hasPlan && state.plan && (
          <FadeInUp delay={0.1} className="mt-8 flex flex-col gap-8">
            <UnitHeader
              plan={state.plan}
              topic={state.topic}
              onGenerateCover={handleGenerateCover}
            />
            <LessonsList
              lessons={state.plan.lessons}
              onRegenerateLesson={handleRegenerateLesson}
              onEditLesson={handleEditLesson}
            />
          </FadeInUp>
        )}

        {!hasPlan && status === 'idle' && (
          <FadeIn delay={0.2} className="text-fg-muted mt-6 text-xs">
            Stored locally in this browser. Multi-teacher isolation arrives in Phase 4 with Clerk.
          </FadeIn>
        )}
      </div>
    </div>
  );
}
