'use client';

import type { UnitLesson } from '@/lib/ai/prompts/units';
import { LessonCard } from '@/features/units/lesson-card';

type LessonsListProps = {
  lessons: UnitLesson[];
  onRegenerateLesson: (lesson: UnitLesson) => Promise<void>;
  onEditLesson: (
    id: string,
    updates: { title: string; walt: string; successCriteria: string[]; body: string },
  ) => void;
};

export function LessonsList({ lessons, onRegenerateLesson, onEditLesson }: LessonsListProps) {
  if (lessons.length === 0) return null;

  const sorted = [...lessons].sort((a, b) =>
    a.weekNumber === b.weekNumber ? a.lessonNumber - b.lessonNumber : a.weekNumber - b.weekNumber,
  );

  const weeks = Array.from(new Set(sorted.map((l) => l.weekNumber))).sort((a, b) => a - b);
  const totalLessons = sorted.length;

  // Map each lesson to its 1-based index in the overall sequence, so the
  // week meta caption can read e.g. "Lessons 1–3 of 12".
  const startIndexByWeek = new Map<number, number>();
  {
    let counter = 0;
    for (const lesson of sorted) {
      if (!startIndexByWeek.has(lesson.weekNumber)) {
        startIndexByWeek.set(lesson.weekNumber, counter + 1);
      }
      counter += 1;
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {weeks.map((week, weekIndex) => {
        const inWeek = sorted.filter((l) => l.weekNumber === week);
        const firstIndex = startIndexByWeek.get(week) ?? 1;
        const lastIndex = firstIndex + inWeek.length - 1;

        return (
          <section key={week} className="flex flex-col gap-4">
            <header className="border-border-subtle flex items-center gap-3 border-b pb-2">
              <span aria-hidden="true" className="bg-accent h-1.5 w-1.5 shrink-0 rounded-full" />
              <h2 className="text-fg-muted text-[11px] font-semibold tracking-wide uppercase">
                Week {week}
              </h2>
              <span className="text-fg-subtle text-[11px]">
                · {inWeek.length} {inWeek.length === 1 ? 'lesson' : 'lessons'}
                {totalLessons > inWeek.length && (
                  <>
                    {' '}
                    · Lessons {firstIndex}–{lastIndex} of {totalLessons}
                  </>
                )}
              </span>
              {weekIndex === 0 && (
                <span className="bg-accent-soft text-accent ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                  Up first
                </span>
              )}
            </header>
            <ol className="flex flex-col gap-4">
              {inWeek.map((lesson) => {
                const globalIndex = sorted.findIndex((l) => l.id === lesson.id);
                return (
                  <li key={lesson.id}>
                    <LessonCard
                      lesson={lesson}
                      index={globalIndex}
                      total={sorted.length}
                      onRegenerateText={() => onRegenerateLesson(lesson)}
                      onEdit={(updates) => onEditLesson(lesson.id, updates)}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
