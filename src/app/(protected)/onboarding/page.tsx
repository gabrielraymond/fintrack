'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { formatIDR } from '@/lib/formatters';
import type { AccountType } from '@/types';

interface AccountEntry {
  name: string;
  type: AccountType;
  balance: string;
}

const EMPTY_ACCOUNT: AccountEntry = { name: '', type: 'bank', balance: '' };

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [accounts, setAccounts] = useState<AccountEntry[]>([{ ...EMPTY_ACCOUNT }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAccount = useCallback((index: number, field: keyof AccountEntry, value: string) => {
    setAccounts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addAccount = useCallback(() => {
    setAccounts((prev) => [...prev, { ...EMPTY_ACCOUNT }]);
  }, []);

  const removeAccount = useCallback((index: number) => {
    setAccounts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    // Re-check auth state
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const activeUser = currentUser || user;

    if (!activeUser) {
      setError('Sesi tidak ditemukan. Silakan login ulang.');
      return;
    }
    setError(null);

    // Validate at least one account with a name
    const validAccounts = accounts.filter((a) => a.name.trim() !== '');
    if (validAccounts.length === 0) {
      setError('Tambahkan minimal satu akun untuk melanjutkan.');
      return;
    }

    setSubmitting(true);
    try {
      // Insert accounts
      const accountRows = validAccounts.map((a) => ({
        user_id: activeUser.id,
        name: a.name.trim(),
        type: a.type,
        balance: a.balance ? parseInt(a.balance, 10) : 0,
      }));

      const { error: accountError } = await supabase.from('accounts').insert(accountRows);
      if (accountError) throw accountError;

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('id', activeUser.id);
      if (profileError) throw profileError;

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Onboarding error:', err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const parseBalance = (value: string): number => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4 pb-24 relative z-50">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-display text-primary mb-2">Selamat Datang di FinTrack!</h1>
          <p className="text-body text-text-secondary">
            Mari mulai dengan menambahkan akun keuangan pertama Anda.
          </p>
        </div>

        {/* Account entries */}
        <div className="space-y-6">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="border border-border rounded-xl p-4 relative"
            >
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAccount(index)}
                  className="absolute top-2 right-2 text-text-muted hover:text-danger text-small p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={`Hapus akun ${index + 1}`}
                >
                  ✕
                </button>
              )}

              <p className="text-caption text-text-muted font-semibold mb-3">
                Akun {index + 1}
              </p>

              {/* Name */}
              <div className="mb-3">
                <label
                  htmlFor={`account-name-${index}`}
                  className="block text-caption text-text-secondary mb-1"
                >
                  Nama Akun
                </label>
                <input
                  id={`account-name-${index}`}
                  type="text"
                  value={account.name}
                  onChange={(e) => updateAccount(index, 'name', e.target.value)}
                  placeholder="Contoh: BCA, GoPay, Tunai"
                  className="w-full border border-border rounded-lg px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Type */}
              <div className="mb-3">
                <label
                  htmlFor={`account-type-${index}`}
                  className="block text-caption text-text-secondary mb-1"
                >
                  Jenis Akun
                </label>
                <select
                  id={`account-type-${index}`}
                  value={account.type}
                  onChange={(e) => updateAccount(index, 'type', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-body text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ACCOUNT_TYPES.map((at) => (
                    <option key={at.value} value={at.value}>
                      {at.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance */}
              <div>
                <label
                  htmlFor={`account-balance-${index}`}
                  className="block text-caption text-text-secondary mb-1"
                >
                  Saldo Awal
                </label>
                <input
                  id={`account-balance-${index}`}
                  type="number"
                  value={account.balance}
                  onChange={(e) => updateAccount(index, 'balance', e.target.value)}
                  placeholder="0"
                  className="w-full border border-border rounded-lg px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {account.balance && (
                  <p className="text-small text-text-muted mt-1">
                    {formatIDR(parseBalance(account.balance))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add account button */}
        <button
          type="button"
          onClick={addAccount}
          className="mt-4 w-full border-2 border-dashed border-border rounded-xl py-3 text-body text-primary hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          + Tambah Akun Lain
        </button>

        {/* Error */}
        {error && (
          <p className="mt-4 text-caption text-danger text-center" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 w-full bg-primary text-primary-foreground rounded-xl py-3 text-body font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {submitting ? 'Menyimpan...' : 'Mulai Gunakan FinTrack'}
        </button>

        <p className="mt-3 text-small text-text-muted text-center">
          Anda bisa menambahkan lebih banyak akun nanti di halaman Akun.
        </p>
      </div>
    </div>
  );
}
