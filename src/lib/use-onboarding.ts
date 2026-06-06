'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'teachwise:onboarding-dismissed';

let cachedSnapshot = false;
let lastRaw: string | null = null;

function readSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === lastRaw) return cachedSnapshot;
  lastRaw = raw;
  cachedSnapshot = raw === '1';
  return cachedSnapshot;
}

function subscribe(notify: () => void): () => void {
  window.addEventListener('storage', notify);
  return () => window.removeEventListener('storage', notify);
}

function writeDismissed(dismissed: boolean): void {
  if (typeof window === 'undefined') return;
  if (dismissed) {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type UseOnboardingResult = {
  dismissed: boolean;
  dismiss: () => void;
  reset: () => void;
};

export function useOnboarding(): UseOnboardingResult {
  const dismissed = useSyncExternalStore(subscribe, readSnapshot, () => false);
  const dismiss = useCallback(() => writeDismissed(true), []);
  const reset = useCallback(() => writeDismissed(false), []);
  return { dismissed, dismiss, reset };
}
