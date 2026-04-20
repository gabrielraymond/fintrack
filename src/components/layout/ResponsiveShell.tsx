'use client';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function ResponsiveShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex" />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav className="md:hidden" />
    </div>
  );
}
