import { OnboardingOverlay } from '@/features/onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnboardingOverlay />
    </>
  );
}
