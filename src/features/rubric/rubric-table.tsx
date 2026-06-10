'use client';

import { Check, Loader2, Pencil, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Rubric, RubricCriterion } from '@/lib/ai/prompts/rubric';

type RubricTableProps = {
  rubric: Rubric;
  busyCriterionId: string | null;
  onEditDescriptor: (criterionId: string, levelId: string, value: string) => void;
  onRegenerateCriterion: (criterion: RubricCriterion) => Promise<void> | void;
};

type EditingKey = string;

function editingKey(criterionId: string, levelId: string): EditingKey {
  return `${criterionId}:${levelId}`;
}

export function RubricTable({
  rubric,
  busyCriterionId,
  onEditDescriptor,
  onRegenerateCriterion,
}: RubricTableProps) {
  const [editing, setEditing] = useState<EditingKey | null>(null);
  const [draft, setDraft] = useState<string>('');

  function startEdit(criterionId: string, levelId: string, current: string): void {
    setEditing(editingKey(criterionId, levelId));
    setDraft(current);
  }

  function cancelEdit(): void {
    setEditing(null);
  }

  function saveEdit(criterionId: string, levelId: string): void {
    const value = draft.trim();
    if (!value) {
      cancelEdit();
      return;
    }
    onEditDescriptor(criterionId, levelId, value);
    setEditing(null);
  }

  return (
    <div className="border-border-subtle bg-surface-raised overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-44" />
            {rubric.levels.map((level) => (
              <col key={level.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-surface/80 supports-[backdrop-filter]:bg-surface/60 border-border-subtle border-b backdrop-blur">
              <th className="text-fg-muted px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase">
                Criterion
              </th>
              {rubric.levels.map((level) => (
                <th
                  key={level.id}
                  className="text-fg-muted border-border-subtle border-l px-4 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="whitespace-nowrap">{level.name}</span>
                    {level.description && (
                      <span className="text-fg-subtle text-[10px] font-normal tracking-normal normal-case">
                        {level.description}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((criterion, idx) => {
              const isBusy = busyCriterionId === criterion.id;
              return (
                <tr key={criterion.id} className={`group ${idx % 2 === 1 ? 'bg-surface/40' : ''}`}>
                  <th
                    scope="row"
                    className="border-border-subtle border-t px-4 py-3 text-left align-top"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-fg text-sm leading-snug font-semibold">
                          {criterion.name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRegenerateCriterion(criterion)}
                        disabled={isBusy || busyCriterionId !== null}
                        title="Regenerate this criterion"
                        aria-label="Regenerate this criterion"
                        className={`border-border-subtle bg-surface text-fg-muted hover:text-fg flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all duration-(--duration-fast) ease-(--ease-out) disabled:cursor-not-allowed disabled:opacity-40 ${
                          isBusy
                            ? 'opacity-100'
                            : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </th>
                  {rubric.levels.map((level) => {
                    const key = editingKey(criterion.id, level.id);
                    const value = criterion.descriptors[level.id] ?? '';
                    const isEditing = editing === key;
                    return (
                      <td
                        key={level.id}
                        className="border-border-subtle border-t border-l px-4 py-3 align-top"
                      >
                        {isEditing ? (
                          <CellEditor
                            value={draft}
                            onChange={setDraft}
                            onSave={() => saveEdit(criterion.id, level.id)}
                            onCancel={cancelEdit}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(criterion.id, level.id, value)}
                            disabled={isBusy}
                            className="text-fg hover:bg-surface focus:bg-surface w-full rounded-md px-2 py-1.5 text-left text-xs leading-relaxed transition-colors disabled:opacity-50"
                            title="Click to edit"
                          >
                            {value || <span className="text-fg-subtle italic">empty</span>}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type CellEditorProps = {
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function CellEditor({ value, onChange, onSave, onCancel }: CellEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSave();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          autoResize(event.currentTarget);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onSave}
        rows={Math.max(2, value.split('\n').length)}
        className="border-border-subtle bg-surface text-fg focus:border-accent w-full resize-none rounded-md border px-2 py-1.5 text-xs leading-relaxed outline-none"
      />
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCancel}
          title="Cancel (Esc)"
          className="border-border-subtle bg-surface text-fg-muted hover:text-fg flex h-6 w-6 items-center justify-center rounded-md border"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSave}
          title="Save (⌘↵)"
          className="bg-accent text-accent-fg flex h-6 w-6 items-center justify-center rounded-md"
        >
          <Check className="h-3 w-3" />
        </button>
      </div>
      <div className="text-fg-subtle flex items-center gap-1 text-[10px]">
        <Pencil className="h-2.5 w-2.5" />
        <span>⌘↵ save · Esc cancel</span>
      </div>
    </div>
  );
}
