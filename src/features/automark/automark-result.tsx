'use client';

import { ArrowRight, CheckCircle2, Sparkles, Target, Trash2 } from 'lucide-react';
import type { AutomarkResult } from '@/lib/ai/prompts/automark';
import { BlockMarkdown } from '@/features/planner/block-markdown';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';

type AutomarkResultViewProps = {
  result: AutomarkResult;
  saved: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function AutomarkResultView({ result, saved, onSave, onDiscard }: AutomarkResultViewProps) {
  return (
    <FadeInUp className="border-border-subtle bg-surface-raised flex flex-col gap-5 rounded-xl border p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
            {result.rubricTitle}
          </div>
          <h2 className="text-fg mt-1 text-xl font-semibold tracking-tight">Feedback</h2>
        </div>
        <div className="border-accent/40 bg-accent-soft text-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
          <Target className="h-3 w-3" />
          Overall: {result.overallLevel}
        </div>
      </header>

      <section>
        <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
          Summary
        </div>
        <div className="mt-2">
          <BlockMarkdown content={result.overallSummary} />
        </div>
      </section>

      {result.perCriterion.length > 0 && (
        <section>
          <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
            Criterion-by-criterion
          </div>
          <StaggerContainer className="mt-2 flex flex-col gap-2">
            {result.perCriterion.map((c) => (
              <StaggerItem
                key={c.criterionId}
                className="border-border-subtle bg-surface flex flex-col gap-1.5 rounded-md border p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-fg text-sm font-semibold">{c.criterionName}</span>
                  <span className="border-accent/30 bg-accent-soft text-accent rounded-full border px-2 py-0.5 text-[10px] font-medium">
                    {c.levelName}
                  </span>
                </div>
                <BlockMarkdown content={c.comment} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section icon={<Sparkles className="text-success h-3.5 w-3.5" />} title="Strengths">
          <ul className="flex flex-col gap-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-fg flex items-start gap-2 text-sm">
                <CheckCircle2 className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section icon={<ArrowRight className="text-accent h-3.5 w-3.5" />} title="Next steps">
          <ul className="flex flex-col gap-1.5">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="text-fg flex items-start gap-2 text-sm">
                <ArrowRight className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <footer className="border-border-subtle flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <p className="text-fg-muted text-[11px]">
          {saved ? (
            <>Saved to your local history below.</>
          ) : (
            <>Save this feedback to your local history. The student work is not stored.</>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!saved && (
            <button
              type="button"
              onClick={onDiscard}
              className="border-border-subtle bg-surface text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
            >
              <Trash2 className="h-3 w-3" />
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            {saved ? 'Saved' : 'Save to history'}
          </button>
        </div>
      </footer>
    </FadeInUp>
  );
}

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="border-border-subtle bg-surface flex flex-col gap-2 rounded-md border p-4">
      <h3 className="text-fg-muted flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
