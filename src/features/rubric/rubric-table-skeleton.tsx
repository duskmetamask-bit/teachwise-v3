'use client';

import { Skeleton } from '@/components/ui/motion';

type RubricTableSkeletonProps = {
  levelCount?: number;
  criterionCount?: number;
};

export function RubricTableSkeleton({
  levelCount = 4,
  criterionCount = 4,
}: RubricTableSkeletonProps) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Drafting the rubric…</span>

      <HeaderSkeleton />

      <div className="border-border-subtle bg-surface-raised overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-44" />
              {Array.from({ length: levelCount }).map((_, i) => (
                <col key={i} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-surface/80 supports-[backdrop-filter]:bg-surface/60 border-border-subtle border-b backdrop-blur">
                <th className="px-4 py-2.5 text-left">
                  <Skeleton width={72} height={11} />
                </th>
                {Array.from({ length: levelCount }).map((_, i) => (
                  <th key={i} className="border-border-subtle border-l px-4 py-2.5 text-left">
                    <Skeleton width="80%" height={12} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: criterionCount }).map((_, idx) => (
                <CriterionRowSkeleton key={idx} index={idx} levelCount={levelCount} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <section className="border-border-subtle bg-surface-raised flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-2">
        <Skeleton width="55%" height={28} />
        <Skeleton width="75%" height={14} />
        <Skeleton width={160} height={11} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Skeleton width={32} height={11} />
        <Skeleton width={72} height={20} rounded="full" />
        <Skeleton width={88} height={20} rounded="full" />
        <Skeleton width={68} height={20} rounded="full" />
      </div>
    </section>
  );
}

function CriterionRowSkeleton({ index, levelCount }: { index: number; levelCount: number }) {
  // Vary descriptor cell line counts so the skeleton doesn't look uniform.
  const descriptorLineOptions = [2, 3, 2, 4, 3] as const;
  const descriptorLines = descriptorLineOptions[index % descriptorLineOptions.length] ?? 3;
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-8/12', 'w-7/12'];

  return (
    <tr className={index % 2 === 1 ? 'bg-surface/40' : ''}>
      <th scope="row" className="border-border-subtle border-t px-4 py-3 text-left align-top">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Skeleton width="70%" height={14} />
          </div>
          <Skeleton width={24} height={24} rounded="md" />
        </div>
      </th>
      {Array.from({ length: levelCount }).map((_, i) => (
        <td key={i} className="border-border-subtle border-t border-l px-4 py-3 align-top">
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: descriptorLines }).map((_, j) => (
              <Skeleton key={j} className={widths[(index + i + j) % widths.length]} height={12} />
            ))}
          </div>
        </td>
      ))}
    </tr>
  );
}
