'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import {
  RubricCriterionSchema,
  RubricLevelSchema,
  RubricSchema,
  type Rubric,
  type RubricCriterion,
} from '@/lib/ai/prompts/rubric';

const STORAGE_KEY = 'teachwise:rubric';

const PersistedRubricSchema = RubricSchema.omit({ generatedAt: true }).extend({
  generatedAt: z.number().int().positive().optional(),
});

const RubricStateSchema = z.object({
  topic: z.string().default(''),
  levelCount: z.number().int().min(2).max(6).default(4),
  rubric: PersistedRubricSchema.nullable().default(null),
  updatedAt: z.number().int().positive().optional(),
});
export type RubricState = z.infer<typeof RubricStateSchema>;

const EMPTY_STATE: RubricState = Object.freeze({
  topic: '',
  levelCount: 4,
  rubric: null,
}) as RubricState;

let cachedSnapshot: RubricState = EMPTY_STATE;
let lastRaw: string | null = null;

function readSnapshot(): RubricState {
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
    const result = RubricStateSchema.safeParse(parsed);
    if (!result.success) {
      cachedSnapshot = EMPTY_STATE;
      return cachedSnapshot;
    }
    const { rubric, ...rest } = result.data;
    cachedSnapshot = Object.freeze({
      ...rest,
      rubric: rubric
        ? (Object.freeze({
            ...rubric,
            levels: rubric.levels.map((l) => Object.freeze({ ...l })),
            criteria: rubric.criteria.map((c) =>
              Object.freeze({
                ...c,
                descriptors: Object.freeze({ ...c.descriptors }),
              }),
            ),
          }) as Rubric)
        : null,
    }) as RubricState;
  } catch {
    cachedSnapshot = EMPTY_STATE;
  }
  return cachedSnapshot;
}

function subscribe(notify: () => void): () => void {
  window.addEventListener('storage', notify);
  return () => window.removeEventListener('storage', notify);
}

function writeState(next: RubricState): void {
  if (typeof window === 'undefined') return;
  const hasContent = next.topic.trim().length > 0 || next.rubric !== null;
  if (!hasContent) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    const stamped = { ...next, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type UseRubricResult = {
  state: RubricState;
  setMeta: (next: { topic: string; levelCount: number }) => void;
  setRubric: (rubric: Rubric) => void;
  replaceCriterion: (criterion: RubricCriterion) => void;
  setDescriptor: (criterionId: string, levelId: string, value: string) => void;
  clear: () => void;
};

export function useRubric(): UseRubricResult {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_STATE);

  const setMeta = useCallback((next: { topic: string; levelCount: number }) => {
    const current = readSnapshot();
    writeState({ ...current, topic: next.topic, levelCount: next.levelCount });
  }, []);

  const setRubric = useCallback((rubric: Rubric) => {
    const current = readSnapshot();
    writeState({ ...current, rubric });
  }, []);

  const replaceCriterion = useCallback((criterion: RubricCriterion) => {
    const current = readSnapshot();
    if (!current.rubric) return;
    const criteria = current.rubric.criteria.map((c) => (c.id === criterion.id ? criterion : c));
    writeState({ ...current, rubric: { ...current.rubric, criteria } });
  }, []);

  const setDescriptor = useCallback((criterionId: string, levelId: string, value: string) => {
    const current = readSnapshot();
    if (!current.rubric) return;
    const criteria = current.rubric.criteria.map((c) => {
      if (c.id !== criterionId) return c;
      return { ...c, descriptors: { ...c.descriptors, [levelId]: value } };
    });
    writeState({ ...current, rubric: { ...current.rubric, criteria } });
  }, []);

  const clear = useCallback(() => writeState(EMPTY_STATE), []);

  return { state, setMeta, setRubric, replaceCriterion, setDescriptor, clear };
}

// Re-export for consumers.
export { RubricLevelSchema, RubricCriterionSchema };
