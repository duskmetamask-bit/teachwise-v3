import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { ProfileForm } from '@/features/profile';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <div className="mb-8">
        <Link
          href="/"
          className="text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-surface flex h-9 w-9 items-center justify-center rounded-md">
            <User className="text-fg h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
              Your profile
            </h1>
            <p className="text-fg-muted mt-1 text-sm">
              Year level, subject, state, and class context. Shapes every AI output.
            </p>
          </div>
        </div>
      </div>

      <div className="border-border-subtle bg-surface-raised rounded-xl border p-6 sm:p-8">
        <ProfileForm />
      </div>

      <p className="text-fg-muted mt-6 text-xs">
        Stored locally in this browser. Multi-teacher isolation arrives in Phase 4 with Clerk.
      </p>
    </div>
  );
}
