import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ─── Users + Workspaces ─────────────────────────────────────────────────
  // In Phase 1-3, a single seeded user + workspace exists for dev.
  // In Phase 4 (Clerk), clerkUserId becomes required and unique.
  users: defineTable({
    clerkUserId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_clerkUserId', ['clerkUserId'])
    .index('by_email', ['email']),

  workspaces: defineTable({
    userId: v.id('users'),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  // ─── Teaching context ───────────────────────────────────────────────────
  classContexts: defineTable({
    workspaceId: v.id('workspaces'),
    className: v.optional(v.string()),
    yearLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    state: v.optional(v.string()),
    classSize: v.optional(v.number()),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_workspaceId', ['workspaceId']),

  // ─── Generated outputs (chat, lesson plans, units, rubrics) ────────────
  savedOutputs: defineTable({
    workspaceId: v.id('workspaces'),
    kind: v.union(
      v.literal('chat'),
      v.literal('lessonPlan'),
      v.literal('unit'),
      v.literal('rubric'),
      v.literal('email'),
      v.literal('other'),
    ),
    title: v.string(),
    content: v.string(),
    ac9Codes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_workspaceId_kind', ['workspaceId', 'kind']),

  // ─── Automark submissions ───────────────────────────────────────────────
  // Per privacy decision: store AI feedback only, discard student work.
  automarkSubmissions: defineTable({
    workspaceId: v.id('workspaces'),
    studentName: v.string(),
    rubricId: v.optional(v.id('savedOutputs')),
    overallGrade: v.string(),
    criteria: v.array(
      v.object({
        name: v.string(),
        grade: v.string(),
        feedback: v.string(),
      }),
    ),
    strengths: v.array(v.string()),
    areasForDevelopment: v.array(v.string()),
    nextSteps: v.array(v.string()),
    createdAt: v.number(),
  }).index('by_workspaceId', ['workspaceId']),

  // ─── Email logs ─────────────────────────────────────────────────────────
  emailLogs: defineTable({
    workspaceId: v.id('workspaces'),
    student: v.optional(v.string()),
    className: v.optional(v.string()),
    intentType: v.string(),
    subject: v.optional(v.string()),
    actionsTaken: v.array(v.string()),
    date: v.string(),
    createdAt: v.number(),
  }).index('by_workspaceId', ['workspaceId']),

  // ─── In-app feedback (Phase 4) ──────────────────────────────────────────
  feedback: defineTable({
    workspaceId: v.optional(v.id('workspaces')),
    rating: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
    comment: v.optional(v.string()),
    page: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_workspaceId', ['workspaceId'])
    .index('by_createdAt', ['createdAt']),
});
