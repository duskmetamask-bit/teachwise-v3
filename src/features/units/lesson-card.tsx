'use client';

import { Check, Loader2, Pencil, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import type { UnitLesson } from '@/lib/ai/prompts/units';
import { BlockMarkdown } from '@/features/planner/block-markdown';

type LessonCardProps = {
  lesson: UnitLesson;
  index: number;
  total: number;
  onRegenerateText: () => Promise<void> | void;
  onEdit: (updates: {
    title: string;
    walt: string;
    successCriteria: string[];
    body: string;
  }) => void;
};

type BusyKind = null | 'regenerate';

function criteriaToText(criteria: string[]): string {
  return criteria.join('\n');
}

function textToCriteria(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*•\s]+/, '').trim())
    .filter((line) => line.length > 0);
}

export function LessonCard({ lesson, index, total, onRegenerateText, onEdit }: LessonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(lesson.title);
  const [draftWalt, setDraftWalt] = useState(lesson.walt);
  const [draftCriteria, setDraftCriteria] = useState(criteriaToText(lesson.successCriteria));
  const [draftBody, setDraftBody] = useState(lesson.body);
  const [busy, setBusy] = useState<BusyKind>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(): void {
    setDraftTitle(lesson.title);
    setDraftWalt(lesson.walt);
    setDraftCriteria(criteriaToText(lesson.successCriteria));
    setDraftBody(lesson.body);
    setIsEditing(true);
  }

  function cancelEdit(): void {
    setIsEditing(false);
  }

  function saveEdit(): void {
    const title = draftTitle.trim();
    const walt = draftWalt.trim();
    const body = draftBody.trim();
    const successCriteria = textToCriteria(draftCriteria);
    if (!title || !walt || !body || successCriteria.length === 0) return;
    onEdit({ title, walt, successCriteria, body });
    setIsEditing(false);
  }

  async function handleRegenerate(): Promise<void> {
    if (busy) return;
    setBusy('regenerate');
    setError(null);
    try {
      await onRegenerateText();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to regenerate lesson.');
    } finally {
      setBusy(null);
    }
  }

  const canSave =
    draftTitle.trim().length > 0 &&
    draftWalt.trim().length > 0 &&
    draftBody.trim().length > 0 &&
    textToCriteria(draftCriteria).length > 0;

  return (
    <article className="border-border-subtle bg-surface-raised rounded-xl border">
      <header className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-fg-muted mb-0.5 flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
            <span>Week {lesson.weekNumber}</span>
            <span className="bg-border-subtle h-3 w-px" />
            <span>Lesson {lesson.lessonNumber}</span>
            <span className="bg-border-subtle h-3 w-px" />
            <span>
              {index + 1} of {total}
            </span>
          </div>
          {isEditing ? (
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="border-border-subtle bg-surface text-fg focus:border-accent w-full rounded-md border px-2.5 py-1.5 text-sm font-semibold outline-none"
              placeholder="Lesson title"
            />
          ) : (
            <h3 className="text-fg text-base font-semibold">{lesson.title}</h3>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isEditing ? (
            <>
              <IconButton label="Cancel edit" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="Save edit" onClick={saveEdit} disabled={!canSave}>
                <Check className="h-3.5 w-3.5" />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton label="Edit lesson" onClick={startEdit} disabled={!!busy}>
                <Pencil className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="Regenerate lesson" onClick={handleRegenerate} disabled={!!busy}>
                {busy === 'regenerate' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
              </IconButton>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div>
          <div className="text-fg-muted mb-1 text-[11px] font-semibold tracking-wide uppercase">
            WALT
          </div>
          {isEditing ? (
            <textarea
              value={draftWalt}
              onChange={(event) => setDraftWalt(event.target.value)}
              rows={2}
              className="border-border-subtle bg-surface text-fg focus:border-accent w-full resize-y rounded-md border px-3 py-2 text-sm outline-none"
              placeholder="We are learning to…"
            />
          ) : (
            <p className="text-fg text-sm">{lesson.walt}</p>
          )}
        </div>

        <div>
          <div className="text-fg-muted mb-1 text-[11px] font-semibold tracking-wide uppercase">
            Success criteria
          </div>
          {isEditing ? (
            <textarea
              value={draftCriteria}
              onChange={(event) => setDraftCriteria(event.target.value)}
              rows={Math.max(3, Math.min(8, lesson.successCriteria.length + 1))}
              className="border-border-subtle bg-surface text-fg focus:border-accent w-full resize-y rounded-md border px-3 py-2 text-sm outline-none"
              placeholder="One criterion per line"
            />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {lesson.successCriteria.map((criterion, i) => (
                <li key={i} className="text-fg flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5 shrink-0">•</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-fg-muted mb-1 text-[11px] font-semibold tracking-wide uppercase">
            Lesson sequence
          </div>
          {isEditing ? (
            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              rows={Math.max(6, Math.min(20, draftBody.split('\n').length + 2))}
              className="border-border-subtle bg-surface text-fg focus:border-accent w-full resize-y rounded-md border px-3 py-2 font-mono text-xs leading-relaxed outline-none"
              placeholder="Lesson body (markdown)"
            />
          ) : (
            <BlockMarkdown content={lesson.body} />
          )}
        </div>

        {error && (
          <p className="border-danger/30 bg-danger/10 text-danger rounded-md border px-3 py-2 text-xs">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
};

function IconButton({ label, onClick, disabled, tone = 'default', children }: IconButtonProps) {
  const toneClass =
    tone === 'danger' ? 'text-fg-muted hover:text-danger' : 'text-fg-muted hover:text-fg';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`border-border-subtle bg-surface flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}
