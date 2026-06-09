'use client';

import { ArrowLeft, Download, Settings, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ChatInput, Messages, QuickActions, exportConversationAsDocx } from '@/features/chat';
import { useAgentChat } from '@/lib/use-agent-chat';
import { useProfile } from '@/lib/use-profile';
import { FadeIn, FadeInDown, FadeInUp, StaggerContainer } from '@/components/ui/motion';

export default function ChatPage() {
  const { profile } = useProfile();
  const { messages, status, error, sendMessage, stop, reset } = useAgentChat({
    teacherPrefs: profile,
  });
  const [draft, setDraft] = useState('');

  const isBusy = status === 'sending' || status === 'streaming';
  const isEmpty = messages.length === 0;

  async function handleSubmit() {
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await sendMessage(text);
  }

  function handleQuickAction(prompt: string) {
    void sendMessage(prompt);
  }

  async function handleExport() {
    if (messages.length === 0) return;
    await exportConversationAsDocx(messages);
  }

  return (
    <div className="bg-bg flex h-full flex-col">
      <FadeInDown>
        <div className="border-border-subtle bg-surface/80 supports-[backdrop-filter]:bg-surface/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Link
                href="/"
                className="text-fg-muted hover:text-fg text-caption flex shrink-0 items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <div className="bg-border-subtle h-4 w-px shrink-0" />
              <div className="bg-accent-soft text-accent text-caption flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-medium">
                <Sparkles className="h-3 w-3" />
                Chat
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href="/profile"
                className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                aria-label="Edit profile"
              >
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors"
                  aria-label="New conversation"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                disabled={messages.length === 0}
                className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg text-caption flex items-center gap-1.5 rounded-md border px-2 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Export conversation as docx"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </FadeInDown>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        {isEmpty ? (
          <FadeIn className="flex flex-col gap-8">
            <FadeInUp>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-accent-soft text-accent flex h-14 w-14 items-center justify-center rounded-2xl">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-h1 text-fg">What can I help with?</h1>
                  <p className="text-body-lg text-fg-muted mt-2 max-w-md">
                    Pick a quick action, or describe what you need. I&apos;ll draft lesson plans,
                    rubrics, report comments, parent emails, sub plans, and more.
                  </p>
                </div>
              </div>
            </FadeInUp>
            <StaggerContainer delay={0.06}>
              <QuickActions onSelect={handleQuickAction} disabled={isBusy} />
            </StaggerContainer>
          </FadeIn>
        ) : (
          <Messages messages={messages} status={status} />
        )}
        {error && (
          <div
            role="alert"
            className="border-danger/30 bg-danger-soft text-danger text-caption mt-6 rounded-lg border px-4 py-3"
          >
            {error}
          </div>
        )}
      </div>

      <div className="border-border-subtle bg-surface/80 supports-[backdrop-filter]:bg-surface/60 border-t backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 sm:py-4">
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
    </div>
  );
}
