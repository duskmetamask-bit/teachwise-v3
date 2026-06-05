import {
  BookOpen,
  CheckCircle2,
  Flame,
  Package,
  PenLine,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import type { PlannerBlockKind } from '@/lib/ai/prompts/planner';

type KindMeta = {
  label: string;
  icon: LucideIcon;
};

export const KIND_META: Record<PlannerBlockKind, KindMeta> = {
  'warm-up': { label: 'Warm-up', icon: Flame },
  main: { label: 'Main', icon: BookOpen },
  practice: { label: 'Practice', icon: PenLine },
  extension: { label: 'Extension', icon: Sparkles },
  'exit-ticket': { label: 'Exit ticket', icon: CheckCircle2 },
  materials: { label: 'Materials', icon: Package },
  notes: { label: 'Teacher notes', icon: StickyNote },
};
