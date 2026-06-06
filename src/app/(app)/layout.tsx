import { ChatBar } from '@/components/chat-bar';
import { TopBar } from '@/components/top-bar';
import { OnboardingOverlay } from '@/features/onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <ChatBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <OnboardingOverlay />
    </div>
  );
}
