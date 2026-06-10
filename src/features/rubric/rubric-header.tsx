'use client';

import { Tag } from 'lucide-react';
import type { Rubric } from '@/lib/ai/prompts/rubric';

type RubricHeaderProps = {
  rubric: Rubric;
};

export function RubricHeader({ rubric }: RubricHeaderProps) {
  const hasAc9 = rubric.ac9Codes.length > 0;
  const levelCount = rubric.levels.length;
  const criterionCount = rubric.criteria.length;

  return (
    <section className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5">
      <div>
        <h1 className="text-fg text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {rubric.title}
        </h1>
        <p className="text-fg-muted mt-1 text-sm leading-relaxed">{rubric.topic}</p>
        <p className="text-fg-subtle mt-2 text-[11px]">
          {levelCount} {levelCount === 1 ? 'level' : 'levels'} · {criterionCount}{' '}
          {criterionCount === 1 ? 'criterion' : 'criteria'}
        </p>
      </div>
      {hasAc9 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
            AC9
          </span>
          {rubric.ac9Codes.map((code) => (
            <span
              key={code}
              className="border-accent/40 bg-accent/10 text-accent inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium"
            >
              <Tag className="h-2.5 w-2.5" />
              {code}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
