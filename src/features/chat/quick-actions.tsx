'use client';

import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  Mail,
  Sparkles,
} from 'lucide-react';

export type QuickAction = {
  id: string;
  label: string;
  prompt: string;
  icon: typeof Sparkles;
};

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'lesson-plan',
    label: 'Lesson plan',
    prompt:
      'Write a single-lesson plan. Include: Year level, subject, topic, duration, learning intention (WALT), success criteria, hook, explicit teaching, guided practice, independent practice, reflection, and differentiation. Australian Curriculum v9 references where relevant.',
    icon: BookOpen,
  },
  {
    id: 'unit-plan',
    label: 'Unit plan',
    prompt:
      'Write a multi-lesson unit plan (3-4 weeks). Include: overview, AC9 alignment with specific codes, weekly breakdown with WALT/success criteria/activities for each lesson, assessment, and differentiation.',
    icon: Calendar,
  },
  {
    id: 'rubric',
    label: 'Rubric',
    prompt:
      'Build a rubric. Output a markdown table with criteria as rows and 4 levels (Beginning / Developing / Proficient / Extending) as columns. Each cell should be specific and observable. Reference AC9 achievement standards.',
    icon: ClipboardList,
  },
  {
    id: 'parent-email',
    label: 'Parent email',
    prompt:
      'Draft a parent email. Include: To, Subject, Body, Suggested actions. Warm, clear, professional tone. Australian school context.',
    icon: Mail,
  },
  {
    id: 'report-comment',
    label: 'Report comment',
    prompt:
      'Write a student report comment. Growth-focused, specific, avoids jargon. Format as one card per student with "Can do now" and "Next step" sections.',
    icon: GraduationCap,
  },
  {
    id: 'sub-plan',
    label: 'Sub plan',
    prompt:
      'Write a substitute teacher plan. Include: timeline with times, activities, materials list, class roster notes, behaviour management notes, and what to leave for the returning teacher.',
    icon: FileText,
  },
] as const;

type QuickActionsProps = {
  onSelect: (prompt: string) => void;
  disabled: boolean;
};

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="border-border-subtle bg-surface-raised rounded-xl border p-5">
      <div className="text-fg-muted mb-3 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        <Sparkles className="text-accent h-3.5 w-3.5" />
        Quick actions
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(action.prompt)}
              className="border-border-subtle bg-surface hover:border-accent hover:bg-accent/5 text-fg disabled:hover:border-border-subtle disabled:hover:bg-surface flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="text-accent h-4 w-4 shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
