import { Bot, BookOpen, Calendar, ClipboardList, FileCheck2, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import type { ComponentType } from 'react';

type Feature = {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  status: 'live' | 'phase-2' | 'phase-3';
  href: string | null;
};

const FEATURES: readonly Feature[] = [
  {
    id: 'chat',
    name: 'Chat',
    description:
      'Free-form teaching assistant. Lesson plans, reports, emails, sub plans, differentiation.',
    icon: Bot,
    status: 'live',
    href: '/chat',
  },
  {
    id: 'planner',
    name: 'Planner',
    description:
      'Block-based lesson plan builder. WALT, success criteria, hook, explicit teaching, reflection.',
    icon: Calendar,
    status: 'phase-3',
    href: null,
  },
  {
    id: 'units',
    name: 'Units',
    description: 'Multi-lesson unit plans with AC9 alignment, assessment, and differentiation.',
    icon: BookOpen,
    status: 'phase-3',
    href: null,
  },
  {
    id: 'rubrics',
    name: 'Rubrics',
    description: 'Generate assessment rubrics aligned to AC9 achievement standards.',
    icon: ClipboardList,
    status: 'phase-3',
    href: null,
  },
  {
    id: 'automark',
    name: 'Automark',
    description: 'AI marking against a rubric. Stores feedback only, discards student work.',
    icon: FileCheck2,
    status: 'phase-3',
    href: null,
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Year level, subject, state, and class context that shapes every AI output.',
    icon: User,
    status: 'phase-3',
    href: null,
  },
] as const;

const STATUS_COPY: Record<Feature['status'], string> = {
  live: 'Live',
  'phase-2': 'Phase 2',
  'phase-3': 'Phase 3',
};

const STATUS_TONE: Record<Feature['status'], string> = {
  live: 'text-success border-success/30 bg-success/10',
  'phase-2': 'text-fg-muted border-border bg-surface-raised',
  'phase-3': 'text-fg-subtle border-border-subtle bg-transparent',
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="mb-10">
        <div className="text-fg-muted mb-2 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          <Sparkles className="text-accent h-3.5 w-3.5" />
          Phase 3 · Chat feature live
        </div>
        <h1 className="text-fg text-3xl font-semibold tracking-tight sm:text-4xl">TeachWise v3</h1>
        <p className="text-fg-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          AI teacher workspace for Australian F-6 teachers. Six features, three modalities (text,
          image, speech), one teaching-agent orchestrator. Chat is the first feature live — the
          agent streams M3 responses, with quick actions, markdown rendering, and docx export.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const card = (
            <article className="border-border-subtle bg-surface-raised hover:border-border flex h-full flex-col rounded-xl border p-5 transition-colors">
              <div className="mb-4 flex items-start justify-between">
                <div className="bg-surface flex h-9 w-9 items-center justify-center rounded-md">
                  <Icon className="text-fg h-4.5 w-4.5" />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[feature.status]}`}
                >
                  {STATUS_COPY[feature.status]}
                </span>
              </div>
              <h2 className="text-fg text-base font-semibold">{feature.name}</h2>
              <p className="text-fg-muted mt-1.5 flex-1 text-sm leading-relaxed">
                {feature.description}
              </p>
              {feature.href && <div className="text-accent mt-4 text-xs font-medium">Open →</div>}
            </article>
          );

          return feature.href ? (
            <Link key={feature.id} href={feature.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={feature.id}>{card}</div>
          );
        })}
      </div>

      <section className="border-border-subtle bg-surface-raised mt-10 rounded-xl border p-6">
        <h2 className="text-fg text-sm font-semibold tracking-wide uppercase">Next up</h2>
        <ul className="text-fg-muted mt-3 space-y-2 text-sm">
          <li>· Confirm the MiniMax image + speech gateway URLs and model names.</li>
          <li>· Phase 3: build planner (block-based + voice input + image per block).</li>
          <li>· Phase 3: build units, rubrics, automark, profile.</li>
          <li>· Phase 4: add Clerk for per-teacher isolation, ship to the pilot.</li>
        </ul>
      </section>
    </div>
  );
}
