'use client';

import { Check, Trash2 } from 'lucide-react';
import { useRef, type FormEvent } from 'react';
import type { TeacherPrefs } from '@/lib/ai';
import { useProfile } from '@/lib/use-profile';

const YEAR_LEVELS = [
  'Foundation',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'F-2',
  '3-4',
  '5-6',
] as const;

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

const PROFILE_KEYS = ['name', 'yearLevel', 'subject', 'state', 'classContext'] as const;

function toPrefs(form: FormData): TeacherPrefs {
  const next: TeacherPrefs = {};
  for (const key of PROFILE_KEYS) {
    const value = form.get(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      next[key] = value.trim();
    }
  }
  return next;
}

export function ProfileForm() {
  const { profile, setProfile, clearProfile } = useProfile();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!event.currentTarget) return;
    setProfile(toPrefs(new FormData(event.currentTarget)));
  }

  function handleClear(): void {
    formRef.current?.reset();
    clearProfile();
  }

  const hasSavedProfile = Object.keys(profile).length > 0;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="Teacher name" hint="Used in greetings and the agent context.">
        <input
          name="name"
          type="text"
          defaultValue={profile.name ?? ''}
          placeholder="e.g. Sarah"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Year level" hint="Single year or composite.">
          <select name="yearLevel" defaultValue={profile.yearLevel ?? ''} className={inputClass}>
            <option value="">— Select —</option>
            {YEAR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <Field label="State / territory" hint="Drives state-specific terminology.">
          <select name="state" defaultValue={profile.state ?? ''} className={inputClass}>
            <option value="">— Select —</option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Subject(s)" hint="Free text — composite or single subject.">
        <input
          name="subject"
          type="text"
          defaultValue={profile.subject ?? ''}
          placeholder="e.g. Maths, English, HASS"
          className={inputClass}
        />
      </Field>

      <Field
        label="Class context"
        hint="Anything the agent should know about your class. EAL/D, support needs, composite mix."
      >
        <textarea
          name="classContext"
          defaultValue={profile.classContext ?? ''}
          placeholder="e.g. Year 3/4 composite, 22 students, 3 EAL/D"
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div className="border-border-subtle flex items-center justify-between border-t pt-6">
        <div className="text-fg-muted text-xs">
          {hasSavedProfile ? (
            <span className="text-success inline-flex items-center gap-1.5">
              <Check className="h-3 w-3" />
              Saved locally in this browser
            </span>
          ) : (
            'No profile saved yet.'
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSavedProfile}
            className="border-border-subtle bg-surface text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
          <button
            type="submit"
            className="bg-accent text-accent-fg hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-semibold"
          >
            Save profile
          </button>
        </div>
      </div>
    </form>
  );
}

const inputClass =
  'border-border-subtle bg-surface text-fg placeholder:text-fg-subtle focus:border-accent w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-fg text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-fg-muted text-xs">{hint}</span>}
    </label>
  );
}
