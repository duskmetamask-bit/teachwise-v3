import type { HotkeyCombo } from './use-hotkeys';

export type GlobalHotkey = {
  combo: HotkeyCombo;
  label: string;
  group: 'Global' | 'Onboarding' | 'Editor';
};

/**
 * The full list of global hotkeys. Used for two purposes:
 *  1. HotkeysRoot wires each one to a handler via `useHotkeys`.
 *  2. ShortcutsOverlay reads this to display the shortcut list.
 */
export const GLOBAL_HOTKEYS: ReadonlyArray<GlobalHotkey> = [
  { combo: 'mod+k', label: 'Open command palette', group: 'Global' },
  { combo: '?', label: 'Show keyboard shortcuts', group: 'Global' },
  { combo: 'mod+shift+l', label: 'Toggle light/dark theme', group: 'Global' },
];

export const ONBOARDING_HOTKEYS: ReadonlyArray<GlobalHotkey> = [
  { combo: 'escape', label: 'Dismiss onboarding', group: 'Onboarding' },
  { combo: 'arrowright', label: 'Next step', group: 'Onboarding' },
  { combo: 'arrowleft', label: 'Previous step', group: 'Onboarding' },
];
