import type { Variants } from 'framer-motion';

/**
 * Shared motion language for TeachWise v3.
 *
 * Goals:
 *  - Calm, not bouncy. Educational tools should feel predictable.
 *  - Fast. 120-360ms total. No drama.
 *  - Reusable: every surface uses the same easing & duration.
 *
 * Always pair with `prefers-reduced-motion` (handled in globals.css).
 */

export const EASE_OUT: readonly [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT: readonly [number, number, number, number] = [0.65, 0, 0.35, 1];

export const DURATION = {
  fast: 0.12,
  base: 0.22,
  slow: 0.36,
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/**
 * Staggered children — for cards, table rows, list items.
 * Use on a parent with `initial="hidden" animate="visible"`.
 */
export const staggerParent = (delay = 0.04): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: delay, delayChildren: 0.02 },
  },
});

/**
 * Pulse for live indicators (streaming, regenerating).
 */
export const pulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
};
