'use client';

import {
  ArrowDown,
  ArrowUp,
  Check,
  ImageIcon,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { PlannerBlock } from '@/lib/ai/prompts/planner';
import { BlockMarkdown } from '@/features/planner/block-markdown';
import { KIND_META } from '@/features/planner/kind-meta';

type BlockCardProps = {
  block: PlannerBlock;
  index: number;
  total: number;
  topic: string;
  onRegenerateText: () => Promise<void> | void;
  onGenerateImage: (prompt: string) => Promise<void> | void;
  onEdit: (heading: string, body: string) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
};

type BusyKind = null | 'regenerate' | 'image';

export function BlockCard({
  block,
  index,
  total,
  topic,
  onRegenerateText,
  onGenerateImage,
  onEdit,
  onDelete,
  onMove,
}: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftHeading, setDraftHeading] = useState(block.heading);
  const [draftBody, setDraftBody] = useState(block.body);
  const [busy, setBusy] = useState<BusyKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePromptDraft, setImagePromptDraft] = useState<string>(block.imagePrompt ?? '');
  const [showImagePromptInput, setShowImagePromptInput] = useState(false);

  const meta = KIND_META[block.kind];
  const Icon = meta.icon;

  function startEdit(): void {
    setDraftHeading(block.heading);
    setDraftBody(block.body);
    setIsEditing(true);
  }

  function cancelEdit(): void {
    setIsEditing(false);
  }

  function saveEdit(): void {
    const heading = draftHeading.trim();
    const body = draftBody.trim();
    if (!heading || !body) return;
    onEdit(heading, body);
    setIsEditing(false);
  }

  async function handleRegenerate(): Promise<void> {
    if (busy) return;
    setBusy('regenerate');
    setError(null);
    try {
      await onRegenerateText();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to regenerate.');
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateImage(): Promise<void> {
    if (busy) return;
    const prompt = imagePromptDraft.trim() || defaultImagePrompt(block, topic);
    setBusy('image');
    setError(null);
    try {
      await onGenerateImage(prompt);
      setShowImagePromptInput(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to generate image.');
    } finally {
      setBusy(null);
    }
  }

  const canMoveUp = index > 0 && !busy && !isEditing;
  const canMoveDown = index < total - 1 && !busy && !isEditing;

  return (
    <article className="group border-border-subtle bg-surface-raised hover:border-border rounded-xl border transition-colors">
      <header className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="bg-surface text-fg-muted border-border-subtle rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                {meta.label}
              </span>
              <span className="text-fg-subtle hidden text-[11px] sm:inline">
                Block {index + 1} of {total}
              </span>
            </div>
            {isEditing ? (
              <input
                value={draftHeading}
                onChange={(event) => setDraftHeading(event.target.value)}
                className="border-border bg-surface text-fg focus:border-accent w-full rounded-md border px-2.5 py-1.5 text-sm font-semibold outline-none"
                placeholder="Block heading"
              />
            ) : (
              <h3 className="text-fg text-base leading-snug font-semibold">{block.heading}</h3>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="border-border-subtle bg-surface flex items-center rounded-md border">
            <IconButton
              label="Move up"
              disabled={!canMoveUp}
              onClick={() => onMove('up')}
              className="border-0"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </IconButton>
            <div className="bg-border-subtle h-4 w-px" />
            <IconButton
              label="Move down"
              disabled={!canMoveDown}
              onClick={() => onMove('down')}
              className="border-0"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </IconButton>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <IconButton
                  label="Cancel edit"
                  onClick={cancelEdit}
                  className="border-border-subtle"
                >
                  <X className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label="Save edit"
                  onClick={saveEdit}
                  disabled={!draftHeading.trim() || !draftBody.trim()}
                  tone="primary"
                  className="border-border-subtle"
                >
                  <Check className="h-3.5 w-3.5" />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton
                  label="Edit block"
                  onClick={startEdit}
                  disabled={!!busy}
                  className="border-border-subtle"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label="Regenerate text"
                  onClick={handleRegenerate}
                  disabled={!!busy}
                  className="border-border-subtle"
                >
                  {busy === 'regenerate' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                  )}
                </IconButton>
              </>
            )}
          </div>
          {!isEditing && (
            <IconButton
              label="Delete block"
              onClick={onDelete}
              disabled={!!busy}
              tone="danger"
              className="border-border-subtle"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          )}
        </div>
      </header>

      <div className="px-5 py-4">
        {block.imageUrl && !isEditing && (
          <figure className="border-border-subtle mb-4 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.imageUrl}
              alt={block.imagePrompt ?? `${meta.label} illustration`}
              className="h-auto w-full"
            />
            {block.imagePrompt && (
              <figcaption className="text-fg-muted bg-surface flex gap-2 px-3 py-2 text-[11px] italic">
                <span className="text-fg-subtle not-italic">Prompt</span>
                <span className="min-w-0 flex-1">{block.imagePrompt}</span>
              </figcaption>
            )}
          </figure>
        )}

        {isEditing ? (
          <textarea
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            rows={Math.max(6, Math.min(20, draftBody.split('\n').length + 2))}
            className="border-border-subtle bg-surface text-fg focus:border-accent w-full resize-y rounded-md border px-3 py-2 font-mono text-sm leading-relaxed outline-none"
            placeholder="Block body (markdown)"
          />
        ) : (
          <BlockMarkdown content={block.body} />
        )}

        {!isEditing && (
          <div
            className={`mt-4 flex flex-wrap items-center gap-2 ${
              block.imageUrl ? 'border-border-subtle border-t pt-3' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setShowImagePromptInput((v) => !v)}
              disabled={!!busy}
              aria-expanded={showImagePromptInput}
              className={`border-border-subtle bg-surface text-fg-muted hover:text-fg hover:border-border inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-(--duration-fast) ease-(--ease-out) disabled:opacity-50 ${
                showImagePromptInput
                  ? 'opacity-100'
                  : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              {block.imageUrl ? 'Regenerate image' : 'Add illustration'}
            </button>
            {showImagePromptInput && (
              <>
                <input
                  value={imagePromptDraft}
                  onChange={(event) => setImagePromptDraft(event.target.value)}
                  placeholder={defaultImagePrompt(block, topic)}
                  disabled={!!busy}
                  className="border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent flex-1 rounded-md border px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!!busy}
                  className="bg-accent text-accent-fg inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                >
                  {busy === 'image' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  Go
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger mt-3 rounded-md border px-3 py-2 text-xs"
          >
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

function defaultImagePrompt(block: PlannerBlock, topic: string): string {
  const firstSentence =
    block.body
      .split(/[.\n]/)[0]
      ?.replace(/[#*`_>-]/g, '')
      .trim() ?? '';
  const subject = topic.trim() || block.heading;
  return `Friendly classroom illustration for an Australian primary school lesson on ${subject}. Focus: ${block.heading}. ${firstSentence}. Bright, modern, inclusive children, soft colours, no text.`.slice(
    0,
    500,
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  className?: string;
  children: React.ReactNode;
};

function IconButton({
  label,
  onClick,
  disabled,
  tone = 'default',
  className = '',
  children,
}: IconButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-fg-muted hover:text-danger'
      : tone === 'primary'
        ? 'text-accent hover:bg-accent/10'
        : 'text-fg-muted hover:text-fg';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}
