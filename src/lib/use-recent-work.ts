'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';

export type RecentItem = {
  id: string;
  feature: 'planner' | 'unit' | 'rubric' | 'automark';
  title: string;
  subtitle?: string;
  updatedAt: number;
  href: string;
};

const PlannerLoose = z
  .object({
    topic: z.string().default(''),
    updatedAt: z.number().int().positive().optional(),
  })
  .passthrough();

const UnitLoose = z
  .object({
    topic: z.string().default(''),
    updatedAt: z.number().int().positive().optional(),
  })
  .passthrough();

const RubricLoose = z
  .object({
    topic: z.string().default(''),
    updatedAt: z.number().int().positive().optional(),
  })
  .passthrough();

const AutomarkLoose = z
  .object({
    history: z
      .array(
        z
          .object({
            id: z.string(),
            topic: z.string(),
            studentName: z.string().optional(),
            createdAt: z.number().int().positive(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

function safeRead<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

function collect(limit: number): RecentItem[] {
  const planner = safeRead('teachwise:planner', PlannerLoose, { topic: '' });
  const unit = safeRead('teachwise:unit', UnitLoose, { topic: '' });
  const rubric = safeRead('teachwise:rubric', RubricLoose, { topic: '' });
  const automark = safeRead('teachwise:automark', AutomarkLoose, { history: [] });

  const items: RecentItem[] = [];

  if (planner.topic.trim().length > 0 && planner.updatedAt) {
    items.push({
      id: 'planner:current',
      feature: 'planner',
      title: planner.topic,
      subtitle: 'Lesson plan',
      updatedAt: planner.updatedAt,
      href: '/planner',
    });
  }

  if (unit.topic.trim().length > 0 && unit.updatedAt) {
    items.push({
      id: 'unit:current',
      feature: 'unit',
      title: unit.topic,
      subtitle: 'Unit plan',
      updatedAt: unit.updatedAt,
      href: '/units',
    });
  }

  if (rubric.topic.trim().length > 0 && rubric.updatedAt) {
    items.push({
      id: 'rubric:current',
      feature: 'rubric',
      title: rubric.topic,
      subtitle: 'Assessment rubric',
      updatedAt: rubric.updatedAt,
      href: '/rubric',
    });
  }

  for (const entry of automark.history) {
    if (!entry.topic.trim() || !entry.createdAt) continue;
    items.push({
      id: `automark:${entry.id}`,
      feature: 'automark',
      title: entry.topic,
      ...(entry.studentName && entry.studentName.trim().length > 0
        ? { subtitle: `Marked for ${entry.studentName}` }
        : { subtitle: 'Marked work' }),
      updatedAt: entry.createdAt,
      href: '/automark',
    });
  }

  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return items.slice(0, limit);
}

/**
 * useRecentWork — reads the last N saved items from localStorage across
 * planner / unit / rubric / automark. Re-reads on any storage event so
 * the home page stays in sync when the user saves elsewhere.
 */
export function useRecentWork(limit: number = 5): RecentItem[] {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    function read() {
      setItems(collect(limit));
    }
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [limit]);

  return items;
}
