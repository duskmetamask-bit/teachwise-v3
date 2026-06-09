'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { UnitLessonSchema, type UnitLesson } from '@/lib/ai/prompts/units';

const STORAGE_KEY = 'teachwise:unit';

const PlanSchema = z
  .object({
    overview: z.string().default(''),
    ac9Codes: z.array(z.string()).default([]),
    assessment: z.string().default(''),
    differentiation: z.string().default(''),
    resources: z.array(z.string()).default([]),
    lessons: z.array(UnitLessonSchema).default([]),
    coverImageUrl: z.string().url().optional(),
    coverImagePrompt: z.string().max(600).optional(),
  })
  .default({
    overview: '',
    ac9Codes: [],
    assessment: '',
    differentiation: '',
    resources: [],
    lessons: [],
  });

const UnitStateSchema = z.object({
  topic: z.string().default(''),
  weeks: z.number().int().min(1).max(20).default(4),
  lessonsPerWeek: z.number().int().min(1).max(10).default(3),
  plan: PlanSchema.nullable().default(null),
  updatedAt: z.number().int().positive().optional(),
});
export type UnitState = z.infer<typeof UnitStateSchema>;

const EMPTY_STATE: UnitState = Object.freeze({
  topic: '',
  weeks: 4,
  lessonsPerWeek: 3,
  plan: null,
}) as UnitState;

let cachedSnapshot: UnitState = EMPTY_STATE;
let lastRaw: string | null = null;

function readSnapshot(): UnitState {
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
    const result = UnitStateSchema.safeParse(parsed);
    cachedSnapshot = result.success
      ? (Object.freeze({
          ...result.data,
          plan: result.data.plan
            ? Object.freeze({
                ...result.data.plan,
                lessons: result.data.plan.lessons.map((l) => Object.freeze({ ...l })),
              })
            : null,
        }) as UnitState)
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

function writeState(next: UnitState): void {
  if (typeof window === 'undefined') return;
  const hasContent =
    next.topic.trim().length > 0 || (next.plan !== null && next.plan.lessons.length > 0);
  if (!hasContent) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    const stamped = { ...next, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type UnitPlanSnapshot = NonNullable<UnitState['plan']>;

type UseUnitResult = {
  state: UnitState;
  setMeta: (next: { topic: string; weeks: number; lessonsPerWeek: number }) => void;
  setPlan: (plan: UnitPlanSnapshot) => void;
  replaceLesson: (id: string, lesson: UnitLesson) => void;
  setCoverImage: (url: string, prompt: string) => void;
  clear: () => void;
};

export function useUnit(): UseUnitResult {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_STATE);

  const setMeta = useCallback((next: { topic: string; weeks: number; lessonsPerWeek: number }) => {
    const current = readSnapshot();
    writeState({
      ...current,
      topic: next.topic,
      weeks: next.weeks,
      lessonsPerWeek: next.lessonsPerWeek,
    });
  }, []);

  const setPlan = useCallback((plan: UnitPlanSnapshot) => {
    const current = readSnapshot();
    writeState({ ...current, plan });
  }, []);

  const replaceLesson = useCallback((id: string, lesson: UnitLesson) => {
    const current = readSnapshot();
    if (!current.plan) return;
    const lessons = current.plan.lessons.map((l) => (l.id === id ? lesson : l));
    writeState({ ...current, plan: { ...current.plan, lessons } });
  }, []);

  const setCoverImage = useCallback((url: string, prompt: string) => {
    const current = readSnapshot();
    if (!current.plan) return;
    writeState({
      ...current,
      plan: { ...current.plan, coverImageUrl: url, coverImagePrompt: prompt },
    });
  }, []);

  const clear = useCallback(() => writeState(EMPTY_STATE), []);

  return { state, setMeta, setPlan, replaceLesson, setCoverImage, clear };
}
