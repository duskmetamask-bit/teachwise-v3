'use client';

import { useEffect, useRef } from 'react';
import { useActiveScope } from './hotkey-scopes';

export type HotkeyCombo = string;

export type HotkeyOptions = {
  scope?: string;
  preventDefault?: boolean;
  enabled?: boolean;
};

const MODIFIER_TOKENS = new Set(['mod', 'ctrl', 'meta', 'shift', 'alt']);

type Parsed = { mods: string[]; key: string };

function parseCombo(combo: HotkeyCombo): Parsed {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop() ?? '';
  const mods = parts.filter((p): p is string => MODIFIER_TOKENS.has(p));
  return { mods, key };
}

function shouldSkipTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

function shouldFire(scope: string | undefined, activeScope: string | null): boolean {
  if (activeScope === null) return !scope;
  return scope === activeScope;
}

/**
 * Bind a keyboard shortcut to a handler.
 *
 * Combo format: `'mod+k' | 'mod+shift+k' | 'escape' | 'arrowright' | '?'`.
 * `mod` is `metaKey || ctrlKey` (Cmd on Mac, Ctrl on Windows).
 *
 * Skips when focus is in an input, textarea, select, or contenteditable.
 * Skips during IME composition. Honors `prefers-reduced-motion` is NOT
 * relevant here — keys fire regardless of motion prefs.
 *
 * Scopes: pass `{ scope: 'onboarding' }` to make the handler only fire
 * while that scope is active (claimed via `useScope`). Global handlers
 * (no scope) do not fire while any scope is active.
 */
export function useHotkeys(
  combo: HotkeyCombo,
  handler: (event: KeyboardEvent) => void,
  opts: HotkeyOptions = {},
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const activeScope = useActiveScope();

  useEffect(() => {
    if (opts.enabled === false) return;

    const { mods, key } = parseCombo(combo);
    if (!key) return;

    const wantsMod = mods.includes('mod');
    const wantsShift = mods.includes('shift');
    const wantsAlt = mods.includes('alt');
    const wantsCtrl = mods.includes('ctrl');
    const wantsMeta = mods.includes('meta');

    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) return;
      if (shouldSkipTarget(event.target)) return;
      if (!shouldFire(opts.scope, activeScope)) return;

      if (wantsMod && !(event.metaKey || event.ctrlKey)) return;
      if (!wantsMod && (event.metaKey || event.ctrlKey)) return;
      if (wantsShift && !event.shiftKey) return;
      if (wantsAlt && !event.altKey) return;
      if (wantsCtrl && !event.ctrlKey) return;
      if (wantsMeta && !event.metaKey) return;

      if (event.key.toLowerCase() !== key) return;

      if (opts.preventDefault !== false) event.preventDefault();
      handlerRef.current(event);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // activeScope is captured via the useSyncExternalStore-driven re-render,
    // so the effect re-binds when the scope stack changes.
  }, [combo, opts.scope, opts.enabled, opts.preventDefault, activeScope]);
}
