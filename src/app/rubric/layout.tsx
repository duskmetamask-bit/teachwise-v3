import { TopBar } from '@/components/top-bar';

export default function RubricLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
