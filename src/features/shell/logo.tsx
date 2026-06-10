'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EASE_OUT, DURATION } from '@/lib/motion';

type LogoProps = {
  size?: 'sm' | 'md';
  href?: string | null;
};

const SIZE = {
  sm: { mark: 'h-5 w-5', text: 'text-sm', gap: 'gap-2' },
  md: { mark: 'h-7 w-7', text: 'text-lg', gap: 'gap-2.5' },
} as const;

export function Logo({ size = 'md', href = '/' }: LogoProps) {
  const sizing = SIZE[size];
  const content = (
    <motion.span
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className={`flex items-center ${sizing.gap}`}
    >
      <LogoMark size={sizing.mark} />
      <span className={`text-gradient-brand ${sizing.text} font-semibold tracking-tight`}>
        TeachWise
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="TeachWise home"
        className="transition-opacity duration-(--duration-fast) ease-(--ease-out) hover:opacity-90"
      >
        {content}
      </Link>
    );
  }
  return content;
}

function LogoMark({ size }: { size: string }) {
  return (
    <span className={`relative inline-block ${size}`} aria-hidden>
      {/* Gradient-tinted glow halo behind the mark — adds the "pop" without
          needing a rasterized asset. Sits behind the SVG, opacity-60. */}
      <span
        className="bg-gradient-brand absolute inset-0 -m-2 rounded-full opacity-60 blur-xl"
        aria-hidden
      />
      <svg viewBox="0 0 24 24" className="relative h-full w-full" aria-hidden role="presentation">
        <defs>
          <linearGradient id="logo-mark-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="35%" stopColor="#c084fc" />
            <stop offset="65%" stopColor="#f0abfc" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
        {/* Main 4-pointed star */}
        <path
          d="M12 1.5l2.3 6.4 6.4 2.3-6.4 2.3L12 18.9l-2.3-6.4-6.4-2.3 6.4-2.3L12 1.5z"
          fill="url(#logo-mark-gradient)"
        />
        {/* Two satellite sparkles */}
        <circle cx="19" cy="5" r="1.3" fill="url(#logo-mark-gradient)" opacity="0.85" />
        <circle cx="5" cy="19" r="1" fill="url(#logo-mark-gradient)" opacity="0.7" />
      </svg>
    </span>
  );
}
