'use client';

import { useSyncExternalStore } from 'react';

/**
 * Restraint gate — codifies the emil-design-eng discipline so motion is
 * never a daily-use liability. Pair with the CSS reset in globals.css
 * (which already collapses animation-duration to 0.01ms under reduce).
 *
 *  - useReducedMotion: when true, all UI motion should be removed or
 *    collapsed to a single frame.
 *  - useFineHover: when true, the pointer is precise (mouse, trackpad)
 *    and hover affordances are safe. When false (touch, coarse pointer),
 *    hover state is suppressed — the user has no way to "leave" it.
 *
 * Both use `useSyncExternalStore` so they re-render only when the OS
 * setting actually flips, not on every matchMedia read.
 */

const QUERY_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const QUERY_FINE_HOVER = '(hover: hover) and (pointer: fine)';

function subscribe(query: string, callback: () => void): () => void {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

const SERVER_SNAPSHOT = false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(QUERY_REDUCED_MOTION, cb),
    () => getSnapshot(QUERY_REDUCED_MOTION),
    () => SERVER_SNAPSHOT,
  );
}

export function useFineHover(): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(QUERY_FINE_HOVER, cb),
    () => getSnapshot(QUERY_FINE_HOVER),
    () => SERVER_SNAPSHOT,
  );
}
