'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const isExpired = searchParams.get('expired') === 'true';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Email atau kata sandi salah. Silakan coba lagi.');
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-8 shadow-md">
        <h1 className="mb-6 text-center text-heading text-text-primary">
          Masuk ke FinTrack
        </h1>

        {isExpired && (
          <div
            className="mb-4 rounded-md bg-warning-light/10 border border-warning p-3 text-caption text-warning-dark"
            role="alert"
          >
            Sesi Anda telah berakhir. Silakan masuk kembali.
          </div>
        )}

        {error && (
          <div
            className="mb-4 rounded-md bg-danger-light/10 border border-danger p-3 text-caption text-danger"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-caption font-medium text-text-secondary"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-border px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-caption font-medium text-text-secondary"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              placeholder="Masukkan kata sandi"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2.5 text-body font-medium text-primary-foreground transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-caption text-text-secondary">
          Belum punya akun?{' '}
          <a
            href="/register"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Daftar
          </a>
        </p>
      </div>
    </div>
  );
}
