'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useHotkeys } from '@/lib/use-hotkeys';
import { useTheme } from '@/components/theme-provider';
import { CommandPalette } from '@/components/ui/command-palette';
import { ShortcutsOverlay } from '@/components/ui/shortcuts-overlay';

type HotkeysContextValue = {
  openPalette: () => void;
  openShortcuts: () => void;
};

const HotkeysContext = createContext<HotkeysContextValue | null>(null);

function useHotkeysContext(): HotkeysContextValue {
  const ctx = useContext(HotkeysContext);
  if (!ctx) {
    throw new Error('useHotkeysContext must be used within HotkeysRoot');
  }
  return ctx;
}

export function useOpenPalette(): () => void {
  return useHotkeysContext().openPalette;
}

export function useOpenShortcuts(): () => void {
  return useHotkeysContext().openShortcuts;
}

export function HotkeysRoot({ children }: { children?: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { toggleTheme } = useTheme();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const toggleShortcuts = useCallback(() => setShortcutsOpen((v) => !v), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  useHotkeys('mod+k', openPalette);
  useHotkeys('?', toggleShortcuts);
  useHotkeys('mod+shift+l', toggleTheme);

  return (
    <HotkeysContext.Provider value={{ openPalette, openShortcuts }}>
      {children}
      <CommandPalette open={paletteOpen} onClose={closePalette} onOpenShortcuts={openShortcuts} />
      <ShortcutsOverlay open={shortcutsOpen} onClose={closeShortcuts} />
    </HotkeysContext.Provider>
  );
}
