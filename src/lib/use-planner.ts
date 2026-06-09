'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { PlannerStateSchema, type PlannerBlock, type PlannerState } from '@/lib/ai/prompts/planner';

const STORAGE_KEY = 'teachwise:planner';

const PlannerStateWithMetaSchema = PlannerStateSchema.extend({
  updatedAt: z.number().int().positive().optional(),
});

const EMPTY_STATE: PlannerState = Object.freeze({
  topic: '',
  duration: '',
  blocks: [],
}) as PlannerState;

let cachedSnapshot: PlannerState = EMPTY_STATE;
let lastRaw: string | null = null;

function readSnapshot(): PlannerState {
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
    const result = PlannerStateWithMetaSchema.safeParse(parsed);
    cachedSnapshot = result.success
      ? (Object.freeze({
          ...result.data,
          blocks: result.data.blocks.map((b) => Object.freeze({ ...b })),
        }) as PlannerState)
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

function writeState(next: PlannerState): void {
  if (typeof window === 'undefined') return;
  const hasContent =
    next.topic.trim().length > 0 || next.duration.trim().length > 0 || next.blocks.length > 0;
  if (!hasContent) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    const stamped = { ...next, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  }
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

type UsePlannerResult = {
  state: PlannerState;
  setMeta: (next: { topic: string; duration: string }) => void;
  setBlocks: (blocks: PlannerBlock[]) => void;
  replaceBlock: (id: string, block: PlannerBlock) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  clear: () => void;
};

export function usePlanner(): UsePlannerResult {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_STATE);

  const setMeta = useCallback((next: { topic: string; duration: string }) => {
    const current = readSnapshot();
    writeState({ ...current, topic: next.topic, duration: next.duration });
  }, []);

  const setBlocks = useCallback((blocks: PlannerBlock[]) => {
    const current = readSnapshot();
    writeState({ ...current, blocks, generatedAt: Date.now() });
  }, []);

  const replaceBlock = useCallback((id: string, block: PlannerBlock) => {
    const current = readSnapshot();
    const blocks = current.blocks.map((b) => (b.id === id ? block : b));
    writeState({ ...current, blocks });
  }, []);

  const removeBlock = useCallback((id: string) => {
    const current = readSnapshot();
    writeState({ ...current, blocks: current.blocks.filter((b) => b.id !== id) });
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const current = readSnapshot();
    const index = current.blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.blocks.length) return;
    const blocks = [...current.blocks];
    const [moved] = blocks.splice(index, 1);
    if (!moved) return;
    blocks.splice(target, 0, moved);
    writeState({ ...current, blocks });
  }, []);

  const clear = useCallback(() => writeState(EMPTY_STATE), []);

  return { state, setMeta, setBlocks, replaceBlock, removeBlock, moveBlock, clear };
}
