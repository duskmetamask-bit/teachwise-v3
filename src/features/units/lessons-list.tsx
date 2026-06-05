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

  return (
    <div className="flex flex-col gap-8">
      {weeks.map((week) => {
        const inWeek = sorted.filter((l) => l.weekNumber === week);
        return (
          <section key={week} className="flex flex-col gap-3">
            <h2 className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
              Week {week}
            </h2>
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
