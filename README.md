# TeachWise v3

AI teacher workspace for Australian F-6 teachers. Built clean from scratch on a new stack with the Total TypeScript process. v3 of an app that previously lived at [`duskmetamask-bit/teachwise-v2`](https://github.com/duskmetamask-bit/teachwise-v2) (Supabase, abandoned).

## What's in the box

- **6 features:** chat, planner, units, rubrics, automark, profile
- **3 modalities:** text (MiniMax M3), image gen, speech (TTS + STT)
- **Single teaching agent** (orchestrator) at the core — wires up in Phase 2
- **Persistent left chat bar** in the workspace shell
- **Dark default + light option**, persisted to localStorage (Clerk metadata in Phase 4)
- **Pilot-minimal Convex schema** — users, workspaces, class contexts, saved outputs, automark submissions, email logs, feedback

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind v4, Framer Motion (Phase 2+)
- **Auth:** Clerk — added in Phase 4, full isolation from EMVY
- **DB:** Convex (new deployment)
- **AI:** MiniMax M3 + image + speech via a single `src/lib/ai.ts` helper
- **Exports:** docx, pdf-lib, pptxgenjs (Phase 3)
- **Process:** Total TypeScript — strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, Zod at boundaries, branded IDs, discriminated unions, Result types
- **Testing:** Vitest + Playwright (Phase 3+)

## Folder layout

```
src/
  app/                    Next.js App Router (thin)
    (app)/                Authenticated app shell (TopBar + ChatBar + content)
    layout.tsx            Root: ThemeProvider, fonts, metadata
    globals.css           Theme tokens (dark + light CSS custom properties)
  components/             Shared UI (ThemeProvider, ThemeToggle, TopBar, ChatBar)
  features/               Co-located feature slices
    chat/                 (Phase 3)
    planner/              (Phase 3)
    units/                (Phase 3)
    rubrics/              (Phase 3)
    automark/             (Phase 3)
    profile/              (Phase 3)
  lib/                    Cross-cutting helpers (ai.ts, prompts/, etc. — Phase 2)
convex/                   Convex schema + functions
  schema.ts               Pilot-minimal schema (7 entities)
```

## Getting started

```bash
# 1. Install
npm install

# 2. Provision Convex (creates a new deployment, generates types, seeds schema)
npx convex dev

# 3. Copy the Convex URL into .env.local
cp .env.example .env.local
# Then paste NEXT_PUBLIC_CONVEX_URL=... and MINIMAX_API_KEY=...

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # Next dev server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier write
npm run format:check # Prettier check
```

Pre-commit: Husky + lint-staged run prettier + eslint on staged files.

## Build phases

Per [the pilot build plan](~/Documents/Claude%20Vault/Projects/teachwise-v2-pilot/decisions.md):

1. **Phase 1 (weeks 1-2):** Foundation. ← _you are here_
2. **Phase 2 (weeks 3-4):** Agent core (text + image + speech via `lib/ai.ts`).
3. **Phase 3 (weeks 5-8):** Features (chat, planner, units, rubrics, automark, profile).
4. **Phase 4 (weeks 9-10):** Auth (Clerk) + ship prep.
5. **Phase 5 (weeks 11-12+):** Pilot with 3-5 trusted teachers.

## Privacy

- **Automark:** stores AI feedback only, discards uploaded student work. No student data is retained.
- **MiniMax AI:** all generations go through the user's own MiniMax gateway. Set `MINIMAX_API_KEY` to a deploy key, not a personal key.
- **No telemetry** in this app. We log to Convex only.

## Deployment

Vercel. New project, isolated from EMVY. Set `NEXT_PUBLIC_CONVEX_URL` + `MINIMAX_API_KEY` in Vercel env vars before the Phase 5 deploy.
