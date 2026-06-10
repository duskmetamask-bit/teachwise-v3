'use client';

import { ArrowLeft, Calendar, Download, Loader2, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { BlocksList, ErrorChip, PlannerForm, exportPlannerAsDocx } from '@/features/planner';
import type { PlannerBlock } from '@/lib/ai/prompts/planner';
import { useProfile } from '@/lib/use-profile';
import { usePlanner } from '@/lib/use-planner';
import { FadeIn, FadeInDown, FadeInUp, Pulse } from '@/components/ui/motion';

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

export default function PlannerPage() {
  const { profile } = useProfile();
  const { state, setMeta, setBlocks, replaceBlock, removeBlock, moveBlock, clear } = usePlanner();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastSubmitRef = useRef<{ topic: string; duration: string } | null>(null);

  const handleGenerate = useCallback(
    async (topic: string, duration: string) => {
      setStatus('generating');
      setError(null);
      setMeta({ topic, duration });
      lastSubmitRef.current = { topic, duration };
      try {
        const { blocks } = await postJson<{ blocks: PlannerBlock[] }>('/api/agent/plan', {
          action: 'generate',
          topic,
          duration,
          teacherPrefs: profile,
        });
        setBlocks(blocks);
        setStatus('idle');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to generate plan.');
        setStatus('error');
      }
    },
    [profile, setBlocks, setMeta],
  );

  const handleRetry = useCallback(() => {
    const last = lastSubmitRef.current;
    if (!last) return;
    void handleGenerate(last.topic, last.duration);
  }, [handleGenerate]);

  const handleDismissError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  const handleRegenerateBlock = useCallback(
    async (block: PlannerBlock) => {
      const { block: next } = await postJson<{ block: PlannerBlock }>('/api/agent/plan', {
        action: 'regenerate-block',
        topic: state.topic,
        duration: state.duration,
        block,
        otherBlocks: state.blocks.filter((b) => b.id !== block.id),
        teacherPrefs: profile,
      });
      replaceBlock(block.id, next);
    },
    [profile, replaceBlock, state.blocks, state.duration, state.topic],
  );

  const handleGenerateImage = useCallback(
    async (block: PlannerBlock, prompt: string) => {
      const { url } = await postJson<{ url: string }>('/api/agent/image', {
        prompt,
        aspectRatio: '16:9',
      });
      replaceBlock(block.id, { ...block, imageUrl: url, imagePrompt: prompt });
    },
    [replaceBlock],
  );

  const handleEditBlock = useCallback(
    (id: string, heading: string, body: string) => {
      const block = state.blocks.find((b) => b.id === id);
      if (!block) return;
      replaceBlock(id, { ...block, heading, body });
    },
    [replaceBlock, state.blocks],
  );

  const handleExport = useCallback(async () => {
    if (state.blocks.length === 0) return;
    await exportPlannerAsDocx(state);
  }, [state]);

  const hasBlocks = state.blocks.length > 0;
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
                <Calendar className="h-3 w-3" />
                Lesson planner
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
              {hasBlocks && (
                <>
                  <button
                    type="button"
                    onClick={clear}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Clear all blocks"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                    aria-label="Export plan as docx"
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
              Lesson planner
            </h1>
            <p className="text-fg-muted mt-1 text-sm">
              Block-based lessons. Regenerate any block, add an illustration on demand, export to
              docx.
            </p>
          </div>
        </FadeInUp>

        <FadeIn delay={0.05}>
          <PlannerForm
            initialTopic={state.topic}
            initialDuration={state.duration}
            isBusy={isBusy}
            onSubmit={handleGenerate}
          />
        </FadeIn>

        {status === 'generating' && (
          <FadeIn className="text-fg-muted mt-6 flex items-center gap-2 text-sm">
            <Pulse>
              <Loader2 className="text-accent h-4 w-4" />
            </Pulse>
            Drafting the lesson plan…
          </FadeIn>
        )}

        {error && status === 'error' && (
          <ErrorChip
            message={error}
            disabled={isBusy}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}

        {hasBlocks && (
          <FadeInUp delay={0.1} className="mt-8">
            <div className="text-fg-muted mb-3 flex items-center justify-between text-xs">
              <span>
                {state.blocks.length} {state.blocks.length === 1 ? 'block' : 'blocks'} ·{' '}
                {state.duration || 'duration not set'}
              </span>
              {state.generatedAt && (
                <span>Generated {new Date(state.generatedAt).toLocaleString()}</span>
              )}
            </div>
            <BlocksList
              blocks={state.blocks}
              topic={state.topic}
              onRegenerateBlock={handleRegenerateBlock}
              onGenerateImage={handleGenerateImage}
              onEditBlock={handleEditBlock}
              onDeleteBlock={removeBlock}
              onMoveBlock={moveBlock}
            />
          </FadeInUp>
        )}

        {!hasBlocks && status === 'idle' && (
          <FadeIn delay={0.2} className="text-fg-muted mt-6 text-xs">
            Stored locally in this browser. Multi-teacher isolation arrives in Phase 4 with Clerk.
          </FadeIn>
        )}
      </div>
    </div>
  );
}
