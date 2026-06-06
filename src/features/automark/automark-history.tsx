'use client';

import { ChevronDown, History as HistoryIcon, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import type { HistoryEntry } from '@/lib/use-automark';
import { BlockMarkdown } from '@/features/planner/block-markdown';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';

type AutomarkHistoryProps = {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

export function AutomarkHistory({ entries, onDelete, onClearAll }: AutomarkHistoryProps) {
  if (entries.length === 0) {
    return (
      <section className="border-border-subtle bg-surface-raised flex flex-col items-center gap-2 rounded-xl border p-8 text-center">
        <HistoryIcon className="text-fg-subtle h-8 w-8" />
        <h2 className="text-fg text-sm font-semibold">No mark history yet</h2>
        <p className="text-fg-muted max-w-md text-xs">
          Mark a piece of student work above and save the feedback to see it here. Only the AI
          feedback is stored — student work is never saved.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
          Mark history · {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-fg-muted hover:text-danger text-[11px] font-medium transition-colors"
        >
          Clear all
        </button>
      </div>
      <StaggerContainer className="flex flex-col gap-2">
        {entries.map((entry) => (
          <StaggerItem key={entry.id}>
            <HistoryRow entry={entry} onDelete={onDelete} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}

type HistoryRowProps = {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
};

function HistoryRow({ entry, onDelete }: HistoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <FadeInUp className="border-border-subtle bg-surface-raised overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="hover:bg-surface flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="text-fg truncate text-sm font-semibold">{entry.topic}</div>
          <div className="text-fg-muted mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
            {entry.studentName && (
              <span className="inline-flex items-center gap-1">
                <User className="h-2.5 w-2.5" />
                {entry.studentName}
              </span>
            )}
            <span>{new Date(entry.createdAt).toLocaleString()}</span>
            <span>·</span>
            <span>{entry.feedback.rubricTitle}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="border-accent/30 bg-accent-soft text-accent rounded-full border px-2 py-0.5 text-[10px] font-medium">
            {entry.feedback.overallLevel}
          </span>
          <ChevronDown
            className={`text-fg-muted h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="border-border-subtle flex flex-col gap-4 border-t p-4">
          <div>
            <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
              Summary
            </div>
            <div className="mt-1">
              <BlockMarkdown content={entry.feedback.overallSummary} />
            </div>
          </div>
          {entry.feedback.perCriterion.length > 0 && (
            <div>
              <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
                Per criterion
              </div>
              <div className="mt-1 flex flex-col gap-1.5">
                {entry.feedback.perCriterion.map((c) => (
                  <div
                    key={c.criterionId}
                    className="border-border-subtle bg-surface flex flex-col gap-1 rounded-md border p-2.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-fg text-xs font-semibold">{c.criterionName}</span>
                      <span className="text-fg-muted text-[10px]">{c.levelName}</span>
                    </div>
                    <BlockMarkdown content={c.comment} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
                Strengths
              </div>
              <ul className="mt-1 flex flex-col gap-1">
                {entry.feedback.strengths.map((s, i) => (
                  <li key={i} className="text-fg text-xs">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
                Next steps
              </div>
              <ul className="mt-1 flex flex-col gap-1">
                {entry.feedback.nextSteps.map((s, i) => (
                  <li key={i} className="text-fg text-xs">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="border-border-subtle bg-surface text-fg-muted hover:text-danger flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </FadeInUp>
  );
}
