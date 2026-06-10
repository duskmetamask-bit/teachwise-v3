'use client';

import { ImageIcon, Loader2, RefreshCw, Tag } from 'lucide-react';
import { useState } from 'react';
import type { UnitLesson, UnitPlan } from '@/lib/ai/prompts/units';
import { BlockMarkdown } from '@/features/planner/block-markdown';

type UnitHeaderProps = {
  plan: Omit<UnitPlan, 'topic' | 'weeks' | 'lessonsPerWeek' | 'generatedAt'>;
  topic: string;
  onGenerateCover: (prompt: string) => Promise<void> | void;
};

function defaultCoverPrompt(topic: string, overview: string): string {
  const firstSentence =
    overview
      .split(/[.\n]/)[0]
      ?.replace(/[#*`_>-]/g, '')
      .trim() ?? '';
  const subject = topic.trim() || 'Australian primary classroom';
  return `Friendly cover illustration for an Australian primary school unit on ${subject}. ${firstSentence}. Soft pastel palette, modern flat illustration, inclusive children, no text.`.slice(
    0,
    500,
  );
}

export function UnitHeader({ plan, topic, onGenerateCover }: UnitHeaderProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [promptDraft, setPromptDraft] = useState(plan.coverImagePrompt ?? '');

  const placeholder = defaultCoverPrompt(topic, plan.overview);

  async function handleGenerate(): Promise<void> {
    if (isBusy) return;
    const prompt = promptDraft.trim() || placeholder;
    setIsBusy(true);
    setError(null);
    try {
      await onGenerateCover(prompt);
      setShowPromptInput(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to generate cover image.');
    } finally {
      setIsBusy(false);
    }
  }

  const hasAc9 = plan.ac9Codes.length > 0;
  const hasResources = plan.resources.length > 0;

  return (
    <section className="flex flex-col gap-5">
      <figure className="group border-border-subtle bg-surface-raised overflow-hidden rounded-xl border">
        {plan.coverImageUrl ? (
          <div className="bg-surface relative">
            <div className="aspect-21/9 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plan.coverImageUrl}
                alt={plan.coverImagePrompt ?? `${topic} cover`}
                className="h-full w-full object-cover"
              />
            </div>
            {plan.coverImagePrompt && (
              <figcaption className="text-fg-muted bg-surface border-border-subtle border-t px-4 py-2 text-[11px] italic">
                {plan.coverImagePrompt}
              </figcaption>
            )}
          </div>
        ) : (
          <div className="bg-surface text-fg-muted flex aspect-21/9 w-full items-center justify-center text-sm">
            No cover image yet.
          </div>
        )}
        <div className="border-border-subtle flex flex-wrap items-center gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={() => setShowPromptInput((v) => !v)}
            disabled={isBusy}
            aria-expanded={showPromptInput}
            className={`border-border-subtle bg-surface text-fg-muted hover:text-fg hover:border-border inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-(--duration-fast) ease-(--ease-out) disabled:opacity-50 ${
              showPromptInput
                ? 'opacity-100'
                : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'
            }`}
          >
            {plan.coverImageUrl ? (
              <RefreshCw className="h-3 w-3" />
            ) : (
              <ImageIcon className="h-3 w-3" />
            )}
            {plan.coverImageUrl ? 'Regenerate cover' : 'Generate cover'}
          </button>
          {showPromptInput && (
            <>
              <input
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                placeholder={placeholder}
                disabled={isBusy}
                className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent flex-1 rounded-md border px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isBusy}
                className="bg-accent text-accent-fg inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                Go
              </button>
            </>
          )}
        </div>
        {error && (
          <p
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger border-t px-4 py-2 text-xs"
          >
            {error}
          </p>
        )}
      </figure>

      {plan.overview && (
        <Section title="Overview">
          <BlockMarkdown content={plan.overview} />
        </Section>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {plan.assessment && (
          <Section title="Assessment">
            <BlockMarkdown content={plan.assessment} />
          </Section>
        )}
        {plan.differentiation && (
          <Section title="Differentiation">
            <BlockMarkdown content={plan.differentiation} />
          </Section>
        )}
      </div>

      {(hasAc9 || hasResources) && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {hasAc9 && (
            <Section title="AC9 content descriptors">
              <ul className="flex flex-wrap gap-1.5">
                {plan.ac9Codes.map((code) => (
                  <li
                    key={code}
                    className="border-accent/40 bg-accent/10 text-accent inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {code}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {hasResources && (
            <Section title="Resources">
              <ul className="flex flex-col gap-1.5">
                {plan.resources.map((resource, i) => (
                  <li key={i} className="text-fg flex items-start gap-2 text-sm">
                    <span className="text-accent mt-0.5 shrink-0">•</span>
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </section>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <div className="border-border-subtle bg-surface-raised flex flex-col gap-2 rounded-xl border p-5">
      <h2 className="text-fg-muted text-xs font-semibold tracking-wide uppercase">{title}</h2>
      <div className="text-fg text-sm">{children}</div>
    </div>
  );
}

export type { UnitLesson };
