'use client';

import PrivacyToggle from '@/components/ui/PrivacyToggle';
import NotificationBell from '@/components/layout/NotificationBell';

export default function ProtectedHeader() {
  return (
    <div className="flex items-center justify-end gap-2 p-4 md:p-0 md:absolute md:top-4 md:right-4 z-30">
      <PrivacyToggle />
      <NotificationBell />
    </div>
  );
}
