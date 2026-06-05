import { Bot, BookOpen, Calendar, ClipboardList, FileCheck2, Sparkles, User } from 'lucide-react';

type Feature = {
  id: string;
  name: string;
  description: string;
  icon: typeof Sparkles;
  status: 'shell' | 'phase-2' | 'phase-3';
};

const FEATURES: readonly Feature[] = [
  {
    id: 'chat',
    name: 'Chat',
    description:
      'Free-form teaching assistant. Lesson plans, reports, emails, sub plans, differentiation.',
    icon: Bot,
    status: 'shell',
  },
  {
    id: 'planner',
    name: 'Planner',
    description:
      'Block-based lesson plan builder. WALT, success criteria, hook, explicit teaching, reflection.',
    icon: Calendar,
    status: 'phase-3',
  },
  {
    id: 'units',
    name: 'Units',
    description: 'Multi-lesson unit plans with AC9 alignment, assessment, and differentiation.',
    icon: BookOpen,
    status: 'phase-3',
  },
  {
    id: 'rubrics',
    name: 'Rubrics',
    description: 'Generate assessment rubrics aligned to AC9 achievement standards.',
    icon: ClipboardList,
    status: 'phase-3',
  },
  {
    id: 'automark',
    name: 'Automark',
    description: 'AI marking against a rubric. Stores feedback only, discards student work.',
    icon: FileCheck2,
    status: 'phase-3',
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Year level, subject, state, and class context that shapes every AI output.',
    icon: User,
    status: 'phase-3',
  },
] as const;

const STATUS_COPY: Record<Feature['status'], string> = {
  shell: 'Shell ready',
  'phase-2': 'Phase 2',
  'phase-3': 'Phase 3',
};

const STATUS_TONE: Record<Feature['status'], string> = {
  shell: 'text-accent border-accent/30 bg-accent/10',
  'phase-2': 'text-fg-muted border-border bg-surface-raised',
  'phase-3': 'text-fg-subtle border-border-subtle bg-transparent',
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="mb-10">
        <div className="text-fg-muted mb-2 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
          <Sparkles className="text-accent h-3.5 w-3.5" />
          Phase 1 · Foundation scaffold
        </div>
        <h1 className="text-fg text-3xl font-semibold tracking-tight sm:text-4xl">TeachWise v3</h1>
        <p className="text-fg-muted mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
          AI teacher workspace for Australian F-6 teachers. Six features, three modalities (text,
          image, speech), one teaching-agent orchestrator. This is the Phase 1 foundation: project,
          schema, theme, shell. No agent yet — that lands in Phase 2.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.id}
              className="border-border-subtle bg-surface-raised hover:border-border rounded-xl border p-5 transition-colors"
            >
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
              <p className="text-fg-muted mt-1.5 text-sm leading-relaxed">{feature.description}</p>
            </article>
          );
        })}
      </div>

      <section className="border-border-subtle bg-surface-raised mt-10 rounded-xl border p-6">
        <h2 className="text-fg text-sm font-semibold tracking-wide uppercase">Next up</h2>
        <ul className="text-fg-muted mt-3 space-y-2 text-sm">
          <li>
            · Run <code className="bg-bg rounded px-1.5 py-0.5 text-xs">npx convex dev</code> to
            provision the Convex deployment and generate types.
          </li>
          <li>· Phase 2: wire the teaching agent + 3 modalities (M3 text, image, speech).</li>
          <li>· Phase 3: build the 6 feature pages with the agent as the orchestrator.</li>
          <li>· Phase 4: add Clerk for per-teacher isolation, ship to the pilot.</li>
        </ul>
      </section>
    </div>
  );
}
