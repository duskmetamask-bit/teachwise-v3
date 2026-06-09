'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';

const stack: string[] = [];
const listeners = new Set<() => void>();
let snapshot: readonly string[] = [];

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly string[] {
  return snapshot;
}

function getServerSnapshot(): readonly string[] {
  return [];
}

function emit(): void {
  snapshot = [...stack];
  for (const listener of listeners) listener();
}

function pushScope(name: string): void {
  stack.push(name);
  emit();
}

function popScope(name: string): void {
  const idx = stack.lastIndexOf(name);
  if (idx !== -1) {
    stack.splice(idx, 1);
    emit();
  }
}

/** Returns the currently active scope (top of stack) or null if no scope is active. */
export function useActiveScope(): string | null {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return current.length > 0 ? current[current.length - 1]! : null;
}

type ScopeContextValue = (name: string) => void;
const ScopeContext = createContext<ScopeContextValue | null>(null);

export function HotkeyScopeProvider({ children }: { children: ReactNode }) {
  return <ScopeContext.Provider value={pushScope}>{children}</ScopeContext.Provider>;
}

/**
 * Claim a hotkey scope for the lifetime of this component. While claimed,
 * global (un-scoped) handlers are suppressed and only handlers with
 * `scope: <name>` fire. Intended for focused flows like onboarding.
 */
export function useScope(name: string): void {
  const push = useContext(ScopeContext);
  if (!push) {
    throw new Error('useScope must be used within HotkeyScopeProvider');
  }
  useEffect(() => {
    push(name);
    return () => popScope(name);
  }, [name, push]);
}
