'use client';

import PrivacyToggle from '@/components/ui/PrivacyToggle';
import NotificationBell from '@/components/layout/NotificationBell';

export default function ProtectedHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:justify-end md:py-2">
      {/* App name — visible only on mobile (sidebar has it on desktop) */}
      <h1 className="text-lg font-bold text-primary md:hidden">FinTrack</h1>
      <div className="flex items-center gap-1">
        <PrivacyToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
