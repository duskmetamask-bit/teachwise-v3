'use client';

import { Modal } from './modal';
import { formatCombo } from '@/lib/hotkey-format';
import { GLOBAL_HOTKEYS, ONBOARDING_HOTKEYS, type GlobalHotkey } from '@/lib/hotkeys';

type ShortcutsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      panelClassName="max-w-lg p-6"
      zIndex={51}
      ariaLabel="Keyboard shortcuts"
    >
      <div className="mb-5">
        <h2 className="text-fg text-lg font-semibold">Keyboard shortcuts</h2>
        <p className="text-fg-muted mt-1 text-sm">
          Press <kbd className="font-mono">?</kbd> any time to show this panel.
        </p>
      </div>

      <ShortcutGroup title="Global" items={GLOBAL_HOTKEYS} />
      <div className="mt-5">
        <ShortcutGroup title="Onboarding" items={ONBOARDING_HOTKEYS} />
      </div>
    </Modal>
  );
}

function ShortcutGroup({ title, items }: { title: string; items: ReadonlyArray<GlobalHotkey> }) {
  return (
    <section>
      <h3 className="text-fg-subtle mb-2 text-[10px] font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={`${item.group}-${String(item.combo)}`}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-fg-muted text-sm">{item.label}</span>
            <kbd className="text-fg border-border-subtle bg-surface rounded border px-2 py-0.5 font-mono text-[11px]">
              {formatCombo(String(item.combo))}
            </kbd>
          </li>
        ))}
      </ul>
    </section>
  );
}
