/**
 * Format a hotkey combo string for display.
 *
 * `mod+k` → `⌘K` on Mac, `Ctrl+K` on Windows/Linux.
 * Handles named keys (`escape`, `arrowright`) and printable characters.
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac/i.test(ua);
}

export function formatCombo(combo: string): string {
  const mac = isMac();
  const parts = combo.split('+');
  return parts
    .map((raw) => {
      const part = raw.toLowerCase();
      if (part === 'mod') return mac ? '⌘' : 'Ctrl';
      if (part === 'ctrl') return mac ? '⌃' : 'Ctrl';
      if (part === 'meta') return mac ? '⌘' : 'Win';
      if (part === 'shift') return mac ? '⇧' : 'Shift';
      if (part === 'alt') return mac ? '⌥' : 'Alt';
      if (part === 'escape' || part === 'esc') return mac ? '⎋' : 'Esc';
      if (part === 'arrowright' || part === 'right') return '→';
      if (part === 'arrowleft' || part === 'left') return '←';
      if (part === 'arrowup' || part === 'up') return '↑';
      if (part === 'arrowdown' || part === 'down') return '↓';
      if (part === 'enter' || part === 'return') return mac ? '↩' : 'Enter';
      if (part === 'tab') return mac ? '⇥' : 'Tab';
      if (part === '?') return '?';
      if (part === '/') return '/';
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(mac ? '' : '+');
}
