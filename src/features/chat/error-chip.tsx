'use client';

import { AlertCircle, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/motion';

type ErrorChipProps = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  disabled: boolean;
};

export function ErrorChip({ message, onRetry, onDismiss, disabled }: ErrorChipProps) {
  return (
    <motion.li
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex gap-3"
      role="alert"
    >
      <div className="border-border-subtle bg-surface-raised text-danger flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="border-danger/30 bg-danger-soft max-w-3xl min-w-0 flex-1 rounded-xl border px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-danger text-caption font-semibold">Failed to respond</p>
            <p className="text-fg-muted text-caption mt-0.5 break-words">{message}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onRetry}
              disabled={disabled}
              className="border-border-subtle bg-surface text-fg text-caption hover:bg-surface-raised flex h-7 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors disabled:opacity-50"
            >
              <RotateCw className="h-3 w-3" />
              Retry
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="text-fg-muted hover:text-fg text-caption rounded-md px-1.5 py-1 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
