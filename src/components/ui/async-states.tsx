'use client';

import { type ReactNode } from 'react';
import { Skeleton } from './motion';

/* ─── Async state primitives (5c) ────────────────────────────────────────
   The three states every async surface must handle:

     <EmptyState />   no data, action-led, AC9-flavoured copy
     <LoadingState /> aria-busy region with skeleton placeholders
     <ErrorState />   recoverable, with a retry affordance

   Per the 5c restraint rule: never animate the error or empty state in a
   way that the user can't act on. The loading state animates only the
   shimmer (already reduced-motion-safe).
*/

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

/**
 * EmptyState — the "you haven't started yet" surface.
 *  - Icon optional; renders muted at fg-subtle.
 *  - Title is required, in h4 typography.
 *  - Body is muted supporting copy.
 *  - Action is any node (typically a Button or Link).
 *  - AC9 voice: calm, action-led, growth-minded. Caller supplies the
 *    copy — this primitive is shape-only.
 */
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="text-fg-subtle">{icon}</div> : null}
      <h3 className="text-h4 text-fg">{title}</h3>
      {body ? <p className="text-body-sm text-fg-muted max-w-sm">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * ErrorState — recoverable failure. role=alert so screen readers
 * announce without requiring focus shift.
 *  - Retry only renders if onRetry is provided. Don't show a button
 *    that goes nowhere.
 */
export function ErrorState({ title, body, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger-soft flex flex-col items-center justify-center gap-3 rounded-md border px-6 py-10 text-center"
    >
      <h3 className="text-h4 text-fg">{title}</h3>
      {body ? <p className="text-body-sm text-fg-muted max-w-sm">{body}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border-border bg-surface-raised text-body-sm text-fg hover:bg-surface-overlay focus-visible:ring-accent mt-1 rounded-md border px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

type LoadingStateProps = {
  /** Approximate height of the content; defaults to 80px. */
  height?: number;
  /** Number of skeleton lines to render. */
  lines?: number;
  /** Accessible label for the loading region (parents should also set aria-busy). */
  label?: string;
};

/**
 * LoadingState — shimmer placeholder region. Renders N lines of
 * skeleton blocks separated by 12px. The region itself carries
 * aria-busy + role=status so assistive tech announces the pending state.
 */
export function LoadingState({ height = 16, lines = 3, label = 'Loading' }: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={height} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
