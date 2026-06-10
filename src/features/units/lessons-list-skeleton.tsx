'use client';

import { Skeleton } from '@/components/ui/motion';

type LessonsListSkeletonProps = {
  count?: number;
};

export function LessonsListSkeleton({ count = 4 }: LessonsListSkeletonProps) {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Drafting the unit plan…</span>

      <div className="border-border-subtle bg-surface-raised overflow-hidden rounded-xl border">
        <Skeleton width="100%" height={224} className="rounded-none" />
        <div className="border-border-subtle flex items-center gap-2 border-t px-4 py-3">
          <Skeleton width={140} height={28} rounded="md" />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {Array.from({ length: count }).map((_, index) => (
          <LessonSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

function LessonSkeleton({ index }: { index: number }) {
  // Vary section line counts so the skeleton doesn't look uniform / fake.
  const waltLines = index === 0 ? 2 : 1;
  const criteriaLines = index % 2 === 0 ? 3 : 4;
  const bodyLineWidths = ['w-11/12', 'w-10/12', 'w-9/12', 'w-8/12', 'w-7/12', 'w-10/12', 'w-9/12'];
  const bodyLines = bodyLineWidths.slice(0, 4 + (index % 3));

  return (
    <div className="border-border-subtle bg-surface-raised rounded-xl border">
      <div className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton width={36} height={36} rounded="md" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Skeleton width={68} height={18} rounded="full" />
              <Skeleton width={120} height={11} />
            </div>
            <Skeleton width="60%" height={18} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton width={28} height={28} rounded="md" />
          <Skeleton width={28} height={28} rounded="md" />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        <section className="flex flex-col gap-1.5">
          <Skeleton width={56} height={11} />
          {Array.from({ length: waltLines }).map((_, i) => (
            <Skeleton key={i} className="w-full" height={12} />
          ))}
        </section>
        <section className="flex flex-col gap-1.5">
          <Skeleton width={120} height={11} />
          {Array.from({ length: criteriaLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={i === criteriaLines - 1 ? 'w-8/12' : 'w-full'}
              height={12}
            />
          ))}
        </section>
        <section className="flex flex-col gap-1.5">
          <Skeleton width={120} height={11} />
          {bodyLines.map((width, i) => (
            <Skeleton key={i} className={width} height={12} />
          ))}
        </section>
      </div>
    </div>
  );
}
