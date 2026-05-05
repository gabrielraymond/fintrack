'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account } from '@/types';

export interface AccountLimitSummaryProps {
  account: Account;
  totalMonthlyObligation: number;
  currentEffectiveLimit: number | null;
  projectedEffectiveLimit: number | null;
}

export default function AccountLimitSummary({
  account,
  totalMonthlyObligation,
  currentEffectiveLimit,
  projectedEffectiveLimit,
}: AccountLimitSummaryProps) {
  const formatIDR = useFormatIDR();

  const typeLabel =
    ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;

  // Official limit: credit_limit for CC, commitment_limit for non-CC
  const officialLimit =
    account.type === 'credit_card' ? account.credit_limit : account.commitment_limit;

  // Determine warning level for projected limit
  const isProjectedNegative =
    projectedEffectiveLimit !== null && projectedEffectiveLimit < 0;
  const isProjectedLow =
    !isProjectedNegative &&
    projectedEffectiveLimit !== null &&
    officialLimit !== null &&
    officialLimit > 0 &&
    projectedEffectiveLimit < officialLimit * 0.1;

  return (
    <Card>
      {/* Account name + type */}
      <div className="mb-3">
        <h3 className="text-subheading text-text-primary">{account.name}</h3>
        <p className="text-caption text-text-secondary">{typeLabel}</p>
      </div>

      <div className="space-y-2">
        {/* Official limit */}
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-secondary">
            {account.type === 'credit_card' ? 'Limit Kartu Kredit' : 'Batas Komitmen'}
          </span>
          <span className="text-caption font-medium text-text-primary">
            {officialLimit !== null ? formatIDR(officialLimit) : (
              <span className="text-text-muted">Tidak dikonfigurasi</span>
            )}
          </span>
        </div>

        {/* Total monthly obligation */}
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-secondary">Total Kewajiban Bulanan</span>
          <span className="text-caption font-semibold text-text-primary">
            {formatIDR(totalMonthlyObligation)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Current effective limit */}
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-secondary">Limit Sekarang</span>
          <span className="text-caption font-semibold text-text-primary">
            {currentEffectiveLimit !== null ? (
              formatIDR(currentEffectiveLimit)
            ) : (
              <span className="text-text-muted">Tidak dikonfigurasi</span>
            )}
          </span>
        </div>

        {/* Projected effective limit */}
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-secondary">Prediksi Setelah Tagihan</span>
          <span
            className={`text-caption font-semibold flex items-center gap-1 ${
              isProjectedNegative
                ? 'text-danger'
                : isProjectedLow
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-text-primary'
            }`}
          >
            {projectedEffectiveLimit !== null ? (
              <>
                {isProjectedNegative && (
                  <span aria-hidden="true" title="Kewajiban melebihi limit">⚠️</span>
                )}
                {isProjectedLow && !isProjectedNegative && (
                  <span aria-hidden="true" title="Limit hampir habis">⚠️</span>
                )}
                {formatIDR(projectedEffectiveLimit)}
              </>
            ) : (
              <span className="text-text-muted">Tidak dikonfigurasi</span>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
