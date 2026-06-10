import {
  Calendar,
  ClipboardList,
  FileCheck2,
  MessageSquare,
  User,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Workspace',
    items: [
      {
        href: '/',
        label: 'Chat',
        description: 'AI teaching assistant',
        icon: MessageSquare,
      },
      {
        href: '/planner',
        label: 'Planner',
        description: 'Block-based lesson plans',
        icon: Calendar,
      },
      {
        href: '/units',
        label: 'Units',
        description: 'Multi-week unit plans',
        icon: BookOpen,
      },
      {
        href: '/rubric',
        label: 'Rubrics',
        description: 'Criteria × levels matrix',
        icon: ClipboardList,
      },
      {
        href: '/automark',
        label: 'Automark',
        description: 'Mark student work',
        icon: FileCheck2,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        href: '/profile',
        label: 'Profile',
        description: 'Class context + preferences',
        icon: User,
      },
    ],
  },
] as const;
