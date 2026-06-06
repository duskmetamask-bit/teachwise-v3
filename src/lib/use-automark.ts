'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { AutomarkResultSchema, type AutomarkResult } from '@/lib/ai/prompts/automark';
import { RubricSchema, type Rubric } from '@/lib/ai/prompts/rubric';

const STORAGE_KEY = 'teachwise:automark';

const HistoryEntrySchema = z.object({
  id: z.string().min(1).max(60),
  topic: z.string().min(1).max(400),
  rubricSnapshot: RubricSchema.nullable(),
  feedback: AutomarkResultSchema,
  studentName: z.string().max(120).optional(),
  createdAt: z.number().int().positive(),
});
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;

const StateSchema = z.object({
  history: z.array(HistoryEntrySchema).default([]),
});
export type AutomarkState = z.infer<typeof StateSchema>;

const EMPTY_STATE: AutomarkState = Object.freeze({ history: [] }) as AutomarkState;

let cachedSnapshot: AutomarkState = EMPTY_STATE;
let lastRaw: string | null = null;

function readSnapshot(): AutomarkState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === lastRaw) return cachedSnapshot;
  lastRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY_STATE;
    return cachedSnapshot;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = StateSchema.safeParse(parsed);
    cachedSnapshot = result.success
      ? (Object.freeze({
          history: result.data.history.map((e) => Object.freeze({ ...e })),
        }) as AutomarkState)
      : EMPTY_STATE;
  } catch {
    cachedSnapshot = EMPTY_STATE;
  }
  return cachedSnapshot;
}

function subscribe(notify: () => void): () => void {
  window.addEventListener('storage', notify);
  return () => window.removeEventListener('storage', notify);
}

function writeState(next: AutomarkState): void {
  if (typeof window === 'undefined') return;
  if (next.history.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type AddEntryInput = {
  topic: string;
  rubricSnapshot: Rubric | null;
  feedback: AutomarkResult;
  studentName?: string;
};

type UseAutomarkResult = {
  state: AutomarkState;
  addEntry: (input: AddEntryInput) => HistoryEntry;
  removeEntry: (id: string) => void;
  clear: () => void;
};

function makeId(): string {
  return `am-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAutomark(): UseAutomarkResult {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_STATE);

  const addEntry = useCallback((input: AddEntryInput): HistoryEntry => {
    const entry: HistoryEntry = {
      id: makeId(),
      topic: input.topic,
      rubricSnapshot: input.rubricSnapshot,
      feedback: input.feedback,
      ...(input.studentName && input.studentName.trim().length > 0
        ? { studentName: input.studentName.trim() }
        : {}),
      createdAt: Date.now(),
    };
    const current = readSnapshot();
    writeState({ history: [entry, ...current.history] });
    return entry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    const current = readSnapshot();
    writeState({ history: current.history.filter((e) => e.id !== id) });
  }, []);

  const clear = useCallback(() => writeState(EMPTY_STATE), []);

  return { state, addEntry, removeEntry, clear };
}
