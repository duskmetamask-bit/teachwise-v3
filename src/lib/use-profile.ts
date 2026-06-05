'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { TeacherPrefsSchema, type TeacherPrefs } from '@/lib/ai';

const STORAGE_KEY = 'teachwise:profile';

const EMPTY_PROFILE: TeacherPrefs = Object.freeze({}) as TeacherPrefs;

let cachedSnapshot: TeacherPrefs = EMPTY_PROFILE;
let lastRaw: string | null = null;

function readSnapshot(): TeacherPrefs {
  if (typeof window === 'undefined') return EMPTY_PROFILE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === lastRaw) return cachedSnapshot;
  lastRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_PROFILE;
    return cachedSnapshot;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = TeacherPrefsSchema.safeParse(parsed);
    cachedSnapshot = result.success
      ? (Object.freeze({ ...result.data }) as TeacherPrefs)
      : EMPTY_PROFILE;
  } catch {
    cachedSnapshot = EMPTY_PROFILE;
  }
  return cachedSnapshot;
}

function subscribe(notify: () => void): () => void {
  window.addEventListener('storage', notify);
  return () => window.removeEventListener('storage', notify);
}

function writeProfile(next: TeacherPrefs): void {
  if (typeof window === 'undefined') return;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      cleaned[key] = value.trim();
    }
  }
  if (Object.keys(cleaned).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }
  // Notify subscribers in this tab. (The real StorageEvent only fires in
  // OTHER tabs, not the one that wrote.)
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type UseProfileResult = {
  profile: TeacherPrefs;
  setProfile: (next: TeacherPrefs) => void;
  clearProfile: () => void;
};

export function useProfile(): UseProfileResult {
  const profile = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_PROFILE);
  const setProfile = useCallback((next: TeacherPrefs) => writeProfile(next), []);
  const clearProfile = useCallback(() => writeProfile({}), []);
  return { profile, setProfile, clearProfile };
}
