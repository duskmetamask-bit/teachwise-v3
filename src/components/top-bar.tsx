'use client';

import { ThemeToggle } from '@/components/theme-toggle';

export function TopBar() {
  return (
    <header className="bg-surface border-border-subtle flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <div className="bg-accent flex h-7 w-7 items-center justify-center rounded-md">
          <span className="text-accent-fg text-xs font-bold">T</span>
        </div>
        <span className="text-fg text-sm font-semibold">TeachWise</span>
        <span className="text-fg-subtle border-border-subtle ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
          v3 · sandbox
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
