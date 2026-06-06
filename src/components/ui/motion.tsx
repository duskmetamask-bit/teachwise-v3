'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeIn, fadeInDown, fadeInUp, pulse, scaleIn, staggerParent } from '@/lib/motion';

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
      transition={{ delay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
      transition={{ delay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
      transition={{ delay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
      transition={{ delay, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
  children?: React.ReactNode;
};

export function Pulse({ children, ...rest }: PulseProps) {
  return (
    <motion.div variants={pulse} initial="initial" animate="animate" {...rest}>
      {children}
    </motion.div>
  );
}
