'use client';

import { Skeleton } from '@/components/ui/motion';

type BlocksListSkeletonProps = {
  count?: number;
};

export function BlocksListSkeleton({ count = 4 }: BlocksListSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Drafting the lesson plan…</span>
      {Array.from({ length: count }).map((_, index) => (
        <BlockSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

function BlockSkeleton({ index }: { index: number }) {
  // Vary the body line widths so the skeleton doesn't look uniform / fake.
  const lineWidths = ['w-11/12', 'w-10/12', 'w-9/12', 'w-8/12', 'w-7/12'];
  const bodyLines =
    index === 0
      ? lineWidths.slice(0, 3)
      : index === 1
        ? lineWidths.slice(0, 4)
        : index === 2
          ? lineWidths.slice(0, 2)
          : lineWidths.slice(0, 3);

  return (
    <div className="border-border-subtle bg-surface-raised rounded-xl border">
      <div className="border-border-subtle flex items-start justify-between gap-3 border-b px-5 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton width={36} height={36} rounded="md" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Skeleton width={72} height={18} rounded="full" />
              <Skeleton width={64} height={11} />
            </div>
            <Skeleton width="60%" height={18} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton width={58} height={28} rounded="md" />
          <Skeleton width={28} height={28} rounded="md" />
          <Skeleton width={28} height={28} rounded="md" />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-5 py-4">
        {bodyLines.map((width, i) => (
          <Skeleton key={i} className={width} height={12} />
        ))}
      </div>
    </div>
  );
}
