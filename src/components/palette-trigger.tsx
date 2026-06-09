'use client';

import { Search } from 'lucide-react';
import { useOpenPalette } from '@/components/hotkeys-root';
import { formatCombo } from '@/lib/hotkey-format';

export function PaletteTrigger() {
  const openPalette = useOpenPalette();

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Open command palette"
      className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg hover:border-border flex h-9 items-center gap-2 rounded-md border px-2.5 transition-colors"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden text-xs sm:inline">Search</span>
      <kbd className="text-fg-subtle border-border-subtle bg-surface hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
        {formatCombo('mod+k')}
      </kbd>
    </button>
  );
}
