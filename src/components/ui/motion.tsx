'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type HTMLAttributes, type ReactNode, useEffect } from 'react';
import {
  DURATION,
  EASE_OUT,
  cardMotion,
  fadeIn,
  fadeInDown,
  fadeInUp,
  pulse,
  scaleIn,
  staggerParent,
} from '@/lib/motion';
import { useFineHover, useReducedMotion } from '@/lib/restraint';

type DivMotionProps = HTMLMotionProps<'div'>;

type FadeInProps = DivMotionProps & {
  delay?: number;
};

export function FadeIn({ delay = 0, children, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ delay = 0, children, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({ delay = 0, children, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInDown}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ delay = 0, children, ...rest }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = DivMotionProps & {
  delay?: number;
};

export function StaggerContainer({ delay = 0.04, children, ...rest }: StaggerProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={staggerParent(delay)} {...rest}>
      {children}
    </motion.div>
  );
}

type StaggerItemProps = DivMotionProps;

export function StaggerItem({ children, ...rest }: StaggerItemProps) {
  return (
    <motion.div variants={fadeInUp} {...rest}>
      {children}
    </motion.div>
  );
}

type PulseProps = DivMotionProps & {
  children?: ReactNode;
};

export function Pulse({ children, ...rest }: PulseProps) {
  return (
    <motion.div variants={pulse} initial="initial" animate="animate" {...rest}>
      {children}
    </motion.div>
  );
}

/* ─── Microinteraction primitives (5c) ─────────────────────────────────── */

type PressableCardProps = DivMotionProps & {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * PressableCard — hover lift + tap scale microinteraction.
 *  - Hover only fires on fine pointers (mouse / trackpad). Touch devices
 *    skip straight to press feedback, which is the only signal a finger
 *    can actually feel.
 *  - Reduced-motion collapses the lift/scale to a focus ring only.
 *  - 120ms duration, ease-out, transform + opacity only (restraint).
 */
export function PressableCard({ children, onClick, disabled, ...rest }: PressableCardProps) {
  const fineHover = useFineHover();
  const reduced = useReducedMotion();
  const enableHover = fineHover && !reduced && !disabled;

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-disabled={disabled}
      initial="rest"
      animate="rest"
      variants={cardMotion}
      className="cursor-pointer"
      style={{ display: 'block' }}
      {...(enableHover && onClick ? { whileHover: 'hover' as const } : {})}
      {...(onClick && !reduced ? { whileTap: 'press' as const } : {})}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
};

/**
 * Skeleton — shimmer placeholder for loading content.
 *  - Skips the shimmer animation entirely under reduced-motion (the global
 *    CSS reset collapses animation-duration; we additionally drop the
 *    animation class for clarity).
 *  - Aria-hidden so screen readers don't announce the placeholder; the
 *    parent is expected to set aria-busy on the loading region.
 */
export function Skeleton({
  width,
  height = 16,
  rounded = 'sm',
  className,
  ...rest
}: SkeletonProps) {
  const reduced = useReducedMotion();

  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === 'lg'
        ? 'rounded-lg'
        : rounded === 'md'
          ? 'rounded-md'
          : rounded === 'none'
            ? ''
            : 'rounded-sm';

  return (
    <div
      aria-hidden="true"
      className={`skeleton ${roundedClass} ${className ?? ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...(reduced ? { animation: 'none' } : {}),
      }}
      {...rest}
    />
  );
}

type ToastProps = DivMotionProps & {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  duration?: number;
  onDismiss?: () => void;
};

const TOAST_VARIANT_CLASS = {
  info: 'bg-surface-raised text-fg border-border',
  success: 'bg-success-soft text-fg border-success/30',
  warning: 'bg-warning-soft text-fg border-warning/30',
  danger: 'bg-danger-soft text-fg border-danger/30',
} as const;

/**
 * Toast — single transient notification. Slides in from the right, slides
 * out on dismiss, auto-dismisses after `duration` (default 4s).
 *  - <300ms entry, <300ms exit. Ease-out.
 *  - role=status + aria-live=polite (announce, not interrupt). Caller
 *    can wrap multiple Toasts in a region with role=alert for stack
 *    semantics; the primitive is single-shot.
 */
export function Toast({
  children,
  variant = 'info',
  duration = 4000,
  onDismiss,
  ...rest
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = window.setTimeout(() => onDismiss?.(), duration);
    return () => window.clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={`rounded-md border px-4 py-3 shadow-md ${TOAST_VARIANT_CLASS[variant]}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
