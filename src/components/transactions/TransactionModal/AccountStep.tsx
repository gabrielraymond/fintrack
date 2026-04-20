'use client';

import React, { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { formatIDR } from '@/lib/formatters';

interface AccountStepProps {
  isTransfer: boolean;
  selectedAccountId: string | null;
  selectedDestinationId: string | null;
  onConfirm: (accountId: string, destinationAccountId?: string) => void;
}

export default function AccountStep({
  isTransfer,
  selectedAccountId,
  selectedDestinationId,
  onConfirm,
}: AccountStepProps) {
  const { data, isLoading } = useAccounts(0);
  const accounts = data?.data ?? [];

  const [accountId, setAccountId] = useState<string | null>(selectedAccountId);
  const [destinationId, setDestinationId] = useState<string | null>(selectedDestinationId);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!accountId) {
      setError('Pilih akun terlebih dahulu');
      return;
    }
    if (isTransfer && !destinationId) {
      setError('Pilih akun tujuan');
      return;
    }
    if (isTransfer && accountId === destinationId) {
      setError('Akun sumber dan tujuan tidak boleh sama');
      return;
    }
    setError(null);
    onConfirm(accountId, destinationId ?? undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <p className="text-body text-text-secondary text-center py-8">
        Belum ada akun. Buat akun terlebih dahulu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Source account */}
      <div>
        <p className="text-body text-text-secondary mb-2">
          {isTransfer ? 'Akun sumber' : 'Pilih akun'}
        </p>
        <div className="space-y-2" role="radiogroup" aria-label={isTransfer ? 'Akun sumber' : 'Pilih akun'}>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              role="radio"
              aria-checked={accountId === acc.id}
              onClick={() => { setAccountId(acc.id); setError(null); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                accountId === acc.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary hover:bg-surface-secondary'
              }`}
              aria-label={`${acc.name} - ${formatIDR(acc.balance)}`}
            >
              <span className="text-body font-medium text-text-primary">{acc.name}</span>
              <span className={`text-caption ${acc.balance < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                {formatIDR(acc.balance)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Destination account (transfers only) */}
      {isTransfer && (
        <div>
          <p className="text-body text-text-secondary mb-2">Akun tujuan</p>
          <div className="space-y-2" role="radiogroup" aria-label="Akun tujuan">
            {accounts.map((acc) => (
              <button
                key={`dest-${acc.id}`}
                type="button"
                role="radio"
                aria-checked={destinationId === acc.id}
                onClick={() => { setDestinationId(acc.id); setError(null); }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  destinationId === acc.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary hover:bg-surface-secondary'
                }`}
                aria-label={`Tujuan: ${acc.name} - ${formatIDR(acc.balance)}`}
              >
                <span className="text-body font-medium text-text-primary">{acc.name}</span>
                <span className={`text-caption ${acc.balance < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                  {formatIDR(acc.balance)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-caption text-danger" role="alert">{error}</p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-body font-medium hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Konfirmasi akun"
      >
        Lanjut
      </button>
    </div>
  );
}
