'use client';

import { Sparkles, Trash2, Download, ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import {
  ChatInput,
  ErrorChip,
  Messages,
  QuickActions,
  exportConversationAsDocx,
} from '@/features/chat';
import { Sidebar } from '@/features/shell/sidebar';
import { useAgentChat } from '@/lib/use-agent-chat';
import { useProfile } from '@/lib/use-profile';
import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/motion';

export default function DashboardPage() {
  const { profile } = useProfile();
  const { messages, status, error, sendMessage, retry, stop, reset } = useAgentChat({
    teacherPrefs: profile,
  });
  const [draft, setDraft] = useState('');
  const [errorDismissed, setErrorDismissed] = useState(false);

  const isBusy = status === 'sending' || status === 'streaming';
  const isEmpty = messages.length === 0;
  const showError = error && !errorDismissed;

  const handleSubmit = useCallback(async () => {
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    setErrorDismissed(false);
    await sendMessage(text);
  }, [draft, sendMessage]);

  const handleQuickAction = useCallback(
    (prompt: string) => {
      setErrorDismissed(false);
      void sendMessage(prompt);
    },
    [sendMessage],
  );

  const handleExport = useCallback(async () => {
    if (messages.length === 0) return;
    await exportConversationAsDocx(messages);
  }, [messages]);

  const greeting = buildGreeting(profile.name, profile.yearLevel, profile.subject);

  return (
    <div className="bg-bg flex h-screen flex-row overflow-hidden">
      <Sidebar />

      <main className="bg-mesh relative flex flex-1 flex-col overflow-hidden">
        {/* Decorative gradient blobs — slow drift, very low opacity. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="mesh-blob-a bg-gradient-brand-soft absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl" />
          <div className="mesh-blob-b bg-gradient-brand-soft absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl" />
          <div className="mesh-blob-c bg-gradient-brand-soft absolute -bottom-24 left-1/3 h-80 w-80 rounded-full opacity-30 blur-3xl" />
        </div>

        {/* Toolbar */}
        <FadeInDown>
          <div className="border-border-subtle bg-surface/60 supports-[backdrop-filter]:bg-surface/40 relative z-10 flex items-center justify-between border-b px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="bg-accent-soft text-accent flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Chat
              </div>
              <span className="text-fg-subtle hidden text-xs sm:inline">
                ⌘+enter to send · ? for shortcuts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="New conversation"
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-(--duration-fast) ease-(--ease-out)"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    aria-label="Export conversation as docx"
                    className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-(--duration-fast) ease-(--ease-out)"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </FadeInDown>

        {/* Scroll region — greeting or thread */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-8 sm:px-8 sm:py-10">
            {isEmpty ? (
              <FadeIn className="flex flex-col gap-8">
                <FadeInUp>
                  <GreetingBlock
                    title={greeting.title}
                    subtitle={greeting.subtitle}
                    name={profile.name ?? undefined}
                    yearLevel={profile.yearLevel ?? undefined}
                    subject={profile.subject ?? undefined}
                    state={profile.state ?? undefined}
                  />
                </FadeInUp>
                <FadeInUp delay={0.08}>
                  <QuickActions onSelect={handleQuickAction} disabled={isBusy} profile={profile} />
                </FadeInUp>
                <FadeInUp delay={0.16}>
                  <FeatureShortcuts />
                </FadeInUp>
              </FadeIn>
            ) : (
              <>
                <Messages messages={messages} status={status} />
                {showError ? (
                  <div className="mt-6">
                    <ErrorChip
                      message={error}
                      disabled={isBusy}
                      onRetry={() => {
                        setErrorDismissed(false);
                        void retry();
                      }}
                      onDismiss={() => setErrorDismissed(true)}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Input dock — sticky at bottom with backdrop blur. */}
        <div className="border-border-subtle bg-surface/70 supports-[backdrop-filter]:bg-surface/50 relative z-10 border-t backdrop-blur-xl">
          <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 sm:py-4">
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSubmit={handleSubmit}
              onStop={stop}
              isBusy={isBusy}
              placeholder={isEmpty ? 'Or describe what you need…' : 'Continue the conversation…'}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function GreetingBlock({
  title,
  subtitle,
  name,
  yearLevel,
  subject,
  state,
}: {
  title: string;
  subtitle: string;
  name?: string | undefined;
  yearLevel?: string | undefined;
  subject?: string | undefined;
  state?: string | undefined;
}) {
  const contextLine =
    name && (yearLevel || subject)
      ? `${[yearLevel, subject].filter(Boolean).join(' ')}${state ? ` · ${state}` : ''}`
      : null;

  return (
    <div className="flex flex-col items-start gap-5">
      <div className="relative">
        <div
          aria-hidden
          className="bg-gradient-brand absolute -inset-2 rounded-2xl opacity-30 blur-2xl"
        />
        <div className="bg-gradient-brand text-accent-fg relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-(--shadow-glow-accent-strong)">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
      <div>
        <h1 className="text-fg text-h1 leading-tight tracking-tight">{title}</h1>
        <p className="text-fg-muted mt-2 text-base leading-relaxed">{subtitle}</p>
        {contextLine && (
          <p className="text-fg-subtle mt-3 text-xs font-medium tracking-wide uppercase">
            {contextLine}
          </p>
        )}
      </div>
    </div>
  );
}

type Shortcut = { href: string; label: string; description: string; icon: LucideIcon };

const SHORTCUTS: readonly Shortcut[] = [
  { href: '/planner', label: 'Planner', description: 'Block-based lessons', icon: ArrowRight },
  { href: '/units', label: 'Units', description: 'Multi-week plans', icon: ArrowRight },
  { href: '/rubric', label: 'Rubrics', description: 'Matrix scoring', icon: ArrowRight },
  { href: '/automark', label: 'Automark', description: 'Mark student work', icon: ArrowRight },
];

function FeatureShortcuts() {
  return (
    <section aria-label="Quick feature shortcuts" className="flex flex-col gap-3">
      <h2 className="text-fg-muted text-caption font-semibold tracking-wide uppercase">
        Or jump to a workspace
      </h2>
      <StaggerContainer delay={0.04} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <StaggerItem key={shortcut.href}>
              <Link
                href={shortcut.href}
                className="group border-border-subtle bg-surface-raised hover:border-accent/40 hover:bg-surface-overlay flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-all duration-(--duration-base) ease-(--ease-out) hover:shadow-(--shadow-glow-accent)"
              >
                <div className="min-w-0">
                  <p className="text-fg text-sm font-semibold">{shortcut.label}</p>
                  <p className="text-fg-muted text-xs">{shortcut.description}</p>
                </div>
                <Icon className="text-fg-subtle group-hover:text-accent h-4 w-4 shrink-0 transition-colors duration-(--duration-fast) ease-(--ease-out) group-hover:translate-x-0.5" />
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}

function buildGreeting(
  name: string | undefined,
  year: string | undefined,
  subject: string | undefined,
) {
  const hasName = !!name && name.trim().length > 0;
  const hasClass = !!year && year.trim().length > 0 && !!subject && subject.trim().length > 0;
  if (hasName && hasClass) {
    return {
      title: `G'day, ${name}.`,
      subtitle: `What are we building for ${year} ${subject} today?`,
    };
  }
  if (hasName) {
    return {
      title: `G'day, ${name}.`,
      subtitle: 'What are we building today?',
    };
  }
  return {
    title: 'Welcome to TeachWise.',
    subtitle: 'Your AI teaching workspace. Draft lessons, rubrics, report comments — fast.',
  };
}
