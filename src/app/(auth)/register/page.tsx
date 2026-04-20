'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await signUp(email, password);

    if (error) {
      if (error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already been registered') ||
          error.status === 422) {
        setError('Email sudah terdaftar. Silakan gunakan email lain atau masuk.');
      } else {
        setError('Pendaftaran gagal. Silakan coba lagi.');
      }
      setIsSubmitting(false);
      return;
    }

    router.push('/onboarding');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-8 shadow-md">
        <h1 className="mb-6 text-center text-heading text-text-primary">
          Daftar FinTrack
        </h1>

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
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-border px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2.5 text-body font-medium text-primary-foreground transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-caption text-text-secondary">
          Sudah punya akun?{' '}
          <a
            href="/login"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Masuk
          </a>
        </p>
      </div>
    </div>
  );
}
