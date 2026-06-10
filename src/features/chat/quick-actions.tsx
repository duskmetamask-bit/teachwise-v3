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
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import type { TeacherPrefs } from '@/lib/ai';

export type QuickAction = {
  id: string;
  label: string;
  hint: string;
  prompt: string;
  icon: typeof Sparkles;
};

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    id: 'lesson-plan',
    label: 'Lesson plan',
    hint: 'Single lesson · WALT + activities',
    prompt:
      'Write a single-lesson plan. Include: Year level, subject, topic, duration, learning intention (WALT), success criteria, hook, explicit teaching, guided practice, independent practice, reflection, and differentiation. Australian Curriculum v9 references where relevant.',
    icon: BookOpen,
  },
  {
    id: 'unit-plan',
    label: 'Unit plan',
    hint: '3–4 weeks · AC9 aligned',
    prompt:
      'Write a multi-lesson unit plan (3-4 weeks). Include: overview, AC9 alignment with specific codes, weekly breakdown with WALT/success criteria/activities for each lesson, assessment, and differentiation.',
    icon: Calendar,
  },
  {
    id: 'rubric',
    label: 'Rubric',
    hint: 'Criteria × 4 levels',
    prompt:
      'Build a rubric. Output a markdown table with criteria as rows and 4 levels (Beginning / Developing / Proficient / Extending) as columns. Each cell should be specific and observable. Reference AC9 achievement standards.',
    icon: ClipboardList,
  },
  {
    id: 'parent-email',
    label: 'Parent email',
    hint: 'Warm · clear · action-led',
    prompt:
      'Draft a parent email. Include: To, Subject, Body, Suggested actions. Warm, clear, professional tone. Australian school context.',
    icon: Mail,
  },
  {
    id: 'report-comment',
    label: 'Report comment',
    hint: 'Growth-focused · jargon-free',
    prompt:
      'Write a student report comment. Growth-focused, specific, avoids jargon. Format as one card per student with "Can do now" and "Next step" sections.',
    icon: GraduationCap,
  },
  {
    id: 'sub-plan',
    label: 'Sub plan',
    hint: 'Timeline + behaviour notes',
    prompt:
      'Write a substitute teacher plan. Include: timeline with times, activities, materials list, class roster notes, behaviour management notes, and what to leave for the returning teacher.',
    icon: FileText,
  },
] as const;

/**
 * Substitute teacher profile into a QuickAction prompt. When a profile is
 * present we prepend a one-line context block ("Context: Year 4 Mathematics
 * teacher in VIC.") so the model gets the right level/subject up front. If
 * the prompt already contains `{yearLevel}` / `{subject}` placeholders, those
 * are also substituted.
 */
function applyProfile(prompt: string, profile: TeacherPrefs): string {
  if (!profile || Object.keys(profile).length === 0) return prompt;
  const lookup: Record<string, string | undefined> = {
    yearLevel: profile.yearLevel,
    subject: profile.subject,
    state: profile.state,
    name: profile.name,
  };
  const substituted = prompt.replace(
    /\{(yearLevel|subject|state|name)\}/g,
    (match, key: string) => {
      const value = lookup[key];
      return value ? value : match;
    },
  );
  const contextBits: string[] = [];
  if (profile.yearLevel || profile.subject) {
    const parts: string[] = [];
    if (profile.yearLevel) parts.push(profile.yearLevel);
    if (profile.subject) parts.push(profile.subject);
    contextBits.push(parts.join(' '));
  }
  if (profile.state) contextBits.push(profile.state);
  if (profile.name) contextBits.push(`(${profile.name})`);
  if (contextBits.length === 0) return substituted;
  return `Context: ${contextBits.join(' · ')} teacher.\n\n${substituted}`;
}

type QuickActionsProps = {
  onSelect: (prompt: string) => void;
  disabled: boolean;
  profile?: TeacherPrefs;
};

export function QuickActions({ onSelect, disabled, profile = {} }: QuickActionsProps) {
  return (
    <div className="border-border-subtle bg-surface-raised rounded-xl border p-5">
      <div className="text-fg-muted mb-3 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        <Sparkles className="text-accent h-3.5 w-3.5" />
        Quick actions
      </div>
      <StaggerContainer className="grid grid-cols-2 gap-2 sm:grid-cols-3" delay={0.05}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const prompt = applyProfile(action.prompt, profile);
          return (
            <StaggerItem key={action.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(prompt)}
                className="border-border-subtle bg-surface hover:border-accent hover:bg-accent/5 text-fg group disabled:hover:border-border-subtle disabled:hover:bg-surface flex h-full w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex w-full items-center gap-2">
                  <Icon className="text-accent h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5" />
                  <span className="truncate text-sm font-medium">{action.label}</span>
                </span>
                <span className="text-fg-subtle text-caption pl-6 leading-tight">
                  {action.hint}
                </span>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
