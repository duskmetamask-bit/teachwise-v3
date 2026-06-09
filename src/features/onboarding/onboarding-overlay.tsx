'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  ClipboardList,
  FileCheck2,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from '@/lib/use-hotkeys';
import { useScope } from '@/lib/hotkey-scopes';
import { useOnboarding } from '@/lib/use-onboarding';

const SAMPLE_TOPIC = 'Fractions: equivalent fractions on a number line';

type Step = 0 | 1 | 2;

type Feature = {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
};

const FEATURES: readonly Feature[] = [
  { id: 'chat', name: 'Chat', icon: Bot, href: '/chat' },
  { id: 'planner', name: 'Planner', icon: Calendar, href: '/planner' },
  { id: 'units', name: 'Units', icon: BookOpen, href: '/units' },
  { id: 'rubrics', name: 'Rubrics', icon: ClipboardList, href: '/rubric' },
  { id: 'automark', name: 'Automark', icon: FileCheck2, href: '/automark' },
  { id: 'profile', name: 'Profile', icon: User, href: '/profile' },
] as const;

const STEP_LABELS = ['Welcome', 'Features', 'Try it'] as const;

export function OnboardingOverlay() {
  const { dismissed, dismiss } = useOnboarding();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(0);

  const goNext = useCallback(() => {
    setStep((current) => (current < 2 ? ((current + 1) as Step) : current));
  }, []);

  const goPrev = useCallback(() => {
    setStep((current) => (current > 0 ? ((current - 1) as Step) : current));
  }, []);

  const handleDismiss = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleTrySample = useCallback(() => {
    dismiss();
    router.push(`/planner?topic=${encodeURIComponent(SAMPLE_TOPIC)}`);
  }, [dismiss, router]);

  useScope('onboarding');
  useHotkeys('escape', handleDismiss, { scope: 'onboarding' });
  useHotkeys('arrowright', goNext, { scope: 'onboarding' });
  useHotkeys('arrowleft', goPrev, { scope: 'onboarding' });

  useEffect(() => {
    if (dismissed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dismissed]);

  if (dismissed) return null;

  const isLast = step === 2;
  const isFirst = step === 0;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[10vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-border-subtle bg-surface-raised relative w-full max-w-xl rounded-2xl border p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Skip onboarding"
              className="text-fg-muted hover:text-fg absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 flex items-center gap-1.5">
              {STEP_LABELS.map((label, index) => (
                <div key={label} className="flex flex-1 items-center gap-1.5">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-220 ${
                      index <= step ? 'bg-accent' : 'bg-border-subtle'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="text-fg-muted mb-1 text-[11px] font-medium tracking-wide uppercase">
              Step {step + 1} of 3
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && <StepWelcome />}
                {step === 1 && <StepFeatures />}
                {step === 2 && <StepTryIt onTry={handleTrySample} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst}
                className="text-fg-muted hover:text-fg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-0"
              >
                Back
              </button>
              {!isLast ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="bg-accent text-accent-fg hover:bg-accent/90 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-fg-muted hover:text-fg text-sm font-medium"
                >
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepWelcome() {
  return (
    <div>
      <div className="bg-accent-soft text-accent mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 id="onboarding-title" className="text-fg text-2xl font-semibold tracking-tight">
        Welcome to TeachWise
      </h2>
      <p className="text-fg-muted mt-3 text-sm leading-relaxed">
        An AI teaching workspace built for Australian F-6 teachers. Six tools, one profile, no
        setup. Everything is saved to this browser — try things out, hit Clear when you&apos;re
        done.
      </p>
    </div>
  );
}

function StepFeatures() {
  return (
    <div>
      <h2 className="text-fg text-2xl font-semibold tracking-tight">What you can do</h2>
      <p className="text-fg-muted mt-3 text-sm leading-relaxed">
        Six features, all live. The agent reads your profile to shape every output.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return <FeatureTile key={feature.id} feature={feature} Icon={Icon} />;
        })}
      </div>
    </div>
  );
}

function StepTryIt({ onTry }: { onTry: () => void }) {
  return (
    <div>
      <h2 className="text-fg text-2xl font-semibold tracking-tight">See it in action</h2>
      <p className="text-fg-muted mt-3 text-sm leading-relaxed">
        The fastest way to get a feel for TeachWise is to plan a lesson. We&apos;ll open the planner
        with a sample topic pre-filled — just hit Generate.
      </p>
      <button
        type="button"
        onClick={onTry}
        className="bg-accent text-accent-fg hover:bg-accent/90 mt-6 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"
      >
        Open the planner with a sample
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FeatureTile({ feature, Icon }: { feature: Feature; Icon: LucideIcon }) {
  return (
    <div className="border-border-subtle bg-surface flex flex-col items-center gap-2 rounded-lg border p-3 text-center">
      <div className="bg-accent-soft text-accent flex h-9 w-9 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-fg text-xs font-medium">{feature.name}</span>
    </div>
  );
}
