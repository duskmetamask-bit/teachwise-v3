'use client';

import {
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardList,
  FileCheck2,
  Sparkles,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useProfile } from '@/lib/use-profile';
import { useRecentWork, type RecentItem } from '@/lib/use-recent-work';
import {
  FadeInDown,
  FadeInUp,
  PressableCard,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/motion';
import { EmptyState } from '@/components/ui/async-states';

const SEND_MESSAGE_EVENT = 'teachwise:send-message';

type ExamplePrompt = {
  text: string;
  icon: LucideIcon;
};

const EXAMPLE_PROMPTS: readonly ExamplePrompt[] = [
  {
    text: 'Plan a 60-minute Year 4 Maths lesson on fractions',
    icon: Calendar,
  },
  {
    text: "Mark this student's persuasive writing against the rubric",
    icon: FileCheck2,
  },
  {
    text: 'Build a 3-week unit on Australian bushfires',
    icon: BookOpen,
  },
  {
    text: 'Draft a rubric for oral presentations',
    icon: ClipboardList,
  },
] as const;

const FEATURE_META: Record<RecentItem['feature'], { icon: LucideIcon; href: string }> = {
  planner: { icon: Calendar, href: '/planner' },
  unit: { icon: BookOpen, href: '/units' },
  rubric: { icon: ClipboardList, href: '/rubric' },
  automark: { icon: FileCheck2, href: '/automark' },
};

function sendToChat(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  window.dispatchEvent(new CustomEvent(SEND_MESSAGE_EVENT, { detail: { text: trimmed } }));
}

function makeGreeting(
  name: string | undefined,
  year: string | undefined,
  subject: string | undefined,
) {
  const hasName = !!name && name.trim().length > 0;
  const hasClass = !!year && year.trim().length > 0 && !!subject && subject.trim().length > 0;

  if (hasName && hasClass) {
    return {
      title: `Welcome back, ${name}.`,
      subtitle: `${year} ${subject}. What are we building today?`,
    };
  }
  if (hasName) {
    return {
      title: `Welcome back, ${name}.`,
      subtitle: 'What are we building today?',
    };
  }
  return {
    title: 'Welcome to TeachWise.',
    subtitle: 'Your AI teaching workspace. What are we building today?',
  };
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < 7 * day)
    return `${Math.floor(diff / day)} day${Math.floor(diff / day) === 1 ? '' : 's'} ago`;
  return new Date(ms).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function RecentWorkCard({ item }: { item: RecentItem }) {
  const meta = FEATURE_META[item.feature];
  const Icon = meta.icon;
  return (
    <PressableCard
      onClick={() => {
        window.location.href = meta.href;
      }}
      className="border-border-subtle bg-surface-raised hover:bg-surface-overlay min-w-[240px] shrink-0 snap-start rounded-lg border p-4 text-left transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body-sm text-fg line-clamp-1 font-medium">{item.title}</h3>
          {item.subtitle ? (
            <p className="text-caption text-fg-muted mt-0.5">{item.subtitle}</p>
          ) : null}
          <p className="text-caption text-fg-subtle mt-2">{formatRelativeTime(item.updatedAt)}</p>
        </div>
        <ArrowRight className="text-fg-subtle h-4 w-4 shrink-0" />
      </div>
    </PressableCard>
  );
}

export default function Home() {
  const { profile } = useProfile();
  const recent = useRecentWork(5);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const greeting = useMemo(
    () => makeGreeting(profile.name, profile.yearLevel, profile.subject),
    [profile.name, profile.yearLevel, profile.subject],
  );

  const hasContent = draft.trim().length > 0;

  const handleSubmit = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      if (!hasContent) return;
      sendToChat(draft);
      setDraft('');
      inputRef.current?.blur();
    },
    [draft, hasContent],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
      {/* Greeting */}
      <FadeInDown>
        <div className="mb-8">
          <h1 className="text-h1 text-fg">{greeting.title}</h1>
          <p className="text-body-lg text-fg-muted mt-2">{greeting.subtitle}</p>
        </div>
      </FadeInDown>

      {/* Primary input */}
      <ScaleIn delay={0.08}>
        <form onSubmit={handleSubmit} className="mb-3">
          <div
            className={`border-border bg-surface-raised rounded-xl border transition-all duration-(--duration-base) ease-(--ease-out) ${
              inputFocused ? 'border-accent shadow-md' : 'shadow-sm'
            }`}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Plan a lesson, draft a rubric, mark work…"
              role="search"
              aria-label="Ask the teaching assistant"
              rows={inputFocused || hasContent ? 4 : 1}
              className="text-fg placeholder:text-fg-subtle w-full resize-none bg-transparent px-5 py-4 text-base outline-none"
            />
            <div className="border-border-subtle flex items-center justify-between border-t px-4 py-2.5">
              <span className="text-caption text-fg-subtle">⌘+enter to send · ? for shortcuts</span>
              <button
                type="submit"
                disabled={!hasContent}
                className="bg-accent text-accent-fg text-caption rounded-md px-3 py-1.5 font-medium transition-opacity duration-(--duration-fast) ease-(--ease-out) hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      </ScaleIn>

      {/* Example prompts */}
      <FadeInUp delay={0.16}>
        <section aria-label="Example prompts" className="mt-10">
          <h2 className="text-caption text-fg-muted mb-3">Try one of these</h2>
          <StaggerContainer delay={0.04} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EXAMPLE_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <StaggerItem key={prompt.text}>
                  <PressableCard
                    onClick={() => sendToChat(prompt.text)}
                    className="border-border-subtle bg-surface-raised hover:bg-surface-overlay block w-full rounded-lg border p-4 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-accent-soft text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-body-sm text-fg leading-snug">{prompt.text}</p>
                    </div>
                  </PressableCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      </FadeInUp>

      {/* Recent work */}
      {recent.length > 0 ? (
        <FadeInUp delay={0.24}>
          <section aria-label="Recent work" className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-caption text-fg-muted">Recent work</h2>
              <span className="text-caption text-fg-subtle">
                {recent.length} item{recent.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2">
              {recent.map((item) => (
                <RecentWorkCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp delay={0.24}>
          <section aria-label="Recent work" className="mt-10">
            <h2 className="text-caption text-fg-muted mb-3">Recent work</h2>
            <div className="border-border-subtle bg-surface-raised rounded-lg border border-dashed">
              <EmptyState
                icon={<Wand2 className="h-5 w-5" />}
                title="Nothing yet"
                body="Your recent lessons, rubrics, and marked work will appear here."
                action={
                  <Link
                    href="/profile"
                    className="text-caption text-accent hover:text-accent-hover inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    Set up your class
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            </div>
          </section>
        </FadeInUp>
      )}

      {/* Feature link, quiet, for when the agentic surface isn't what they need */}
      <FadeInUp delay={0.32}>
        <div className="text-caption text-fg-subtle mt-16 flex items-center justify-center gap-2">
          <Sparkles className="text-accent h-3 w-3" />
          <span>Phase 3 · All 6 features live</span>
        </div>
      </FadeInUp>
    </div>
  );
}
