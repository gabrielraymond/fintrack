'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';
import PrivacyToggle from '@/components/ui/PrivacyToggle';
import NotificationBell from '@/components/layout/NotificationBell';

export default function ProtectedHeader() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="flex items-center justify-between px-4 py-3 md:justify-end md:py-2">
      {/* Logo — visible only on mobile (sidebar has it on desktop) */}
      <Link href="/dashboard" aria-label="FinTrack — Beranda" className="md:hidden">
        <Image
          src={isDark ? '/icons/logo-dark.svg' : '/icons/logo-light.svg'}
          alt="FinTrack"
          width={120}
          height={30}
          priority
          className="h-8 w-auto"
        />
      </Link>
      <div className="flex items-center gap-1">
        <PrivacyToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
