'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Logo } from './logo';
import { NAV_SECTIONS } from './feature-nav';
import { DURATION, EASE_OUT, fadeInUp, staggerParent } from '@/lib/motion';

const STAGGER = 0.05;

type SidebarProps = {
  className?: string;
};

function readTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' ? 'light' : 'dark';
}

function subscribeTheme(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  // Theme is set on <html data-theme> by the inline init script before React
  // mounts, so we can read it directly via useSyncExternalStore — no
  // useState-in-effect anti-pattern.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'dark');

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('teachwise-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <aside
      className={`border-border-subtle bg-surface/70 supports-[backdrop-filter]:bg-surface/50 hidden shrink-0 flex-col border-r backdrop-blur-xl md:flex md:w-64 ${className}`}
      aria-label="Primary navigation"
    >
      {/* Logo block */}
      <div className="flex h-16 items-center px-5">
        <Logo size="md" />
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Workspace">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <motion.div
            key={section.label}
            initial="hidden"
            animate="visible"
            variants={staggerParent(STAGGER)}
            className={sectionIndex === 0 ? '' : 'mt-6'}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="text-fg-subtle px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] uppercase"
            >
              {section.label}
            </motion.h2>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <motion.li key={item.href} variants={fadeInUp}>
                    <NavLink item={item} active={active} Icon={Icon} />
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </nav>

      {/* Footer: theme toggle + version */}
      <div className="border-border-subtle flex items-center justify-between border-t px-4 py-3">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="border-border-subtle bg-surface-raised text-fg-muted hover:text-fg hover:bg-surface-overlay flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-(--duration-fast) ease-(--ease-out)"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <span className="text-fg-subtle text-[10px] font-semibold tracking-wider uppercase">
          v3 · 5c
        </span>
      </div>
    </aside>
  );
}

type NavLinkProps = {
  item: {
    href: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  active: boolean;
  Icon: React.ComponentType<{ className?: string }>;
};

function NavLink({ item, active, Icon }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-(--duration-fast) ease-(--ease-out) ${
        active
          ? 'text-fg bg-accent-soft shadow-(--shadow-glow-accent)'
          : 'text-fg-muted hover:text-fg hover:bg-surface-overlay'
      }`}
    >
      {/* Active indicator bar — slides in via layoutId. */}
      {active && (
        <motion.span
          layoutId="nav-active-bar"
          className="bg-gradient-brand absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-(--duration-fast) ease-(--ease-out) ${
          active
            ? 'bg-accent text-accent-fg shadow-(--shadow-glow-accent-strong)'
            : 'bg-surface-sunken text-fg-muted group-hover:text-fg'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      {active && <ChevronRight className="text-fg-subtle h-3 w-3 shrink-0" />}
    </Link>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
