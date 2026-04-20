'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show a minimal loading state while determining auth
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <h1 className="text-heading text-primary font-bold mb-2">FinTrack</h1>
        <p className="text-caption text-text-secondary">Memuat...</p>
      </div>
    </div>
  );
}
