'use client';

import { Command } from 'cmdk';
import {
  Bot,
  BookOpen,
  Calendar,
  ClipboardList,
  FileCheck2,
  Keyboard,
  Moon,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { formatCombo } from '@/lib/hotkey-format';
import { Modal } from './modal';

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
};

type NavItem = {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  {
    id: 'chat',
    name: 'Chat',
    href: '/chat',
    icon: Bot,
    description: 'Free-form teaching assistant',
  },
  {
    id: 'planner',
    name: 'Planner',
    href: '/planner',
    icon: Calendar,
    description: 'Block-based lesson plan builder',
  },
  {
    id: 'units',
    name: 'Units',
    href: '/units',
    icon: BookOpen,
    description: 'Multi-lesson unit plans',
  },
  {
    id: 'rubrics',
    name: 'Rubrics',
    href: '/rubric',
    icon: ClipboardList,
    description: 'Assessment rubrics',
  },
  {
    id: 'automark',
    name: 'Automark',
    href: '/automark',
    icon: FileCheck2,
    description: 'AI marking with feedback only',
  },
  {
    id: 'profile',
    name: 'Profile',
    href: '/profile',
    icon: User,
    description: 'Year, subject, state, class context',
  },
];

export function CommandPalette({ open, onClose, onOpenShortcuts }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Modal
      open={open}
      onClose={onClose}
      panelClassName="max-w-xl overflow-hidden p-0"
      ariaLabel="Command palette"
    >
      <Command label="Command palette" className="flex flex-col" loop>
        <div className="border-border-subtle flex items-center gap-2 border-b px-4 py-3">
          <Search className="text-fg-muted h-4 w-4 shrink-0" />
          <Command.Input
            placeholder="Search features, actions…"
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
            autoFocus
          />
          <kbd className="text-fg-subtle border-border-subtle bg-surface hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
            {formatCombo('escape')}
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          <Command.Empty className="text-fg-muted py-8 text-center text-sm">
            No results found.
          </Command.Empty>

          <Command.Group
            heading="Go to"
            className="text-fg-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.id}
                  value={`go to ${item.name} ${item.description}`}
                  onSelect={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  className="data-[selected=true]:bg-accent-soft text-fg flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
                >
                  <Icon className="text-fg-muted h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-fg-subtle text-xs">{item.description}</span>
                </Command.Item>
              );
            })}
          </Command.Group>

          <Command.Separator className="bg-border-subtle my-1 h-px" />

          <Command.Group
            heading="Actions"
            className="text-fg-subtle [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase"
          >
            <Command.Item
              value="Toggle light dark theme"
              onSelect={() => {
                onClose();
                toggleTheme();
              }}
              className="data-[selected=true]:bg-accent-soft text-fg flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
            >
              <Moon className="text-fg-muted h-4 w-4 shrink-0" />
              <span className="flex-1">
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              </span>
              <kbd className="text-fg-subtle border-border-subtle bg-surface rounded border px-1.5 py-0.5 font-mono text-[10px]">
                {formatCombo('mod+shift+l')}
              </kbd>
            </Command.Item>
            <Command.Item
              value="Show keyboard shortcuts help"
              onSelect={() => {
                onClose();
                onOpenShortcuts();
              }}
              className="data-[selected=true]:bg-accent-soft text-fg flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
            >
              <Keyboard className="text-fg-muted h-4 w-4 shrink-0" />
              <span className="flex-1">Show keyboard shortcuts</span>
              <kbd className="text-fg-subtle border-border-subtle bg-surface rounded border px-1.5 py-0.5 font-mono text-[10px]">
                {formatCombo('?')}
              </kbd>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="border-border-subtle text-fg-subtle flex items-center justify-between border-t px-4 py-2 text-[11px]">
          <span>
            <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> to select
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> to close
          </span>
        </div>
      </Command>
    </Modal>
  );
}
