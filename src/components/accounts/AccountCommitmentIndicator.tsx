'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface AccountCommitmentIndicatorProps {
  accountId: string;
  totalMonthlyObligation: number;
  currentEffectiveLimit: number | null;
  projectedEffectiveLimit: number | null;
}

/**
 * Small indicator shown inside AccountCard when an account has active
 * installments or recurring commitments.
 *
 * Clicking navigates to /commitments?account={accountId}.
 * Only rendered when totalMonthlyObligation > 0.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
export default function AccountCommitmentIndicator({
  accountId,
  totalMonthlyObligation,
  currentEffectiveLimit,
  projectedEffectiveLimit,
}: AccountCommitmentIndicatorProps) {
  const router = useRouter();
  const formatIDR = useFormatIDR();

  if (totalMonthlyObligation <= 0) return null;

  const isProjectedNegative =
    projectedEffectiveLimit !== null && projectedEffectiveLimit < 0;

  const handleClick = () => {
    router.push(`/commitments?account=${accountId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-3 w-full text-left rounded-lg border border-border bg-surface-secondary px-3 py-2 hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Lihat detail cicilan dan komitmen"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption text-text-secondary font-medium">Kewajiban Bulanan</span>
        <span className="text-caption text-text-primary font-semibold">
          {formatIDR(totalMonthlyObligation)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-caption text-text-secondary">Limit Sekarang</span>
        <span className="text-caption text-text-primary">
          {currentEffectiveLimit !== null
            ? formatIDR(currentEffectiveLimit)
            : 'Tidak dikonfigurasi'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-caption text-text-secondary">Prediksi Setelah Tagihan</span>
        <span
          className={`text-caption font-medium ${
            isProjectedNegative ? 'text-danger' : 'text-text-primary'
          }`}
        >
          {projectedEffectiveLimit !== null
            ? formatIDR(projectedEffectiveLimit)
            : 'Tidak dikonfigurasi'}
        </span>
      </div>
    </button>
  );
}
