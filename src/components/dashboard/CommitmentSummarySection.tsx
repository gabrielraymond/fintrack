'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useActiveInstallments } from '@/hooks/useInstallments';
import { useActiveCommitments } from '@/hooks/useRecurringCommitments';
import {
  calculateRemainingTenor,
  calculateCurrentInstallmentNumber,
  calculateTotalMonthlyObligation,
  calculateProjectedEffectiveLimit,
} from '@/lib/limitCalculations';
import type { Account } from '@/types';

interface CommitmentSummarySectionProps {
  /** All active accounts — used to find CC accounts and their credit limits */
  accounts: Account[];
}

/**
 * Dashboard section showing:
 * - Total monthly installment + commitment obligation
 * - Per-CC-account: projected effective limit after deducting all active obligations
 * - Top 3 active installments with progress (ke-X dari Y)
 */
export default function CommitmentSummarySection({ accounts }: CommitmentSummarySectionProps) {
  const formatIDR = useFormatIDR();
  const today = new Date();

  const { data: installments = [], isLoading: installmentsLoading } = useActiveInstallments();
  const { data: commitments = [], isLoading: commitmentsLoading } = useActiveCommitments();

  const isLoading = installmentsLoading || commitmentsLoading;

  // Total monthly obligation across ALL accounts
  const totalMonthlyObligation = useMemo(
    () => calculateTotalMonthlyObligation(installments, commitments),
    [installments, commitments]
  );

  // CC accounts with credit_limit configured
  const ccAccountsWithLimit = useMemo(
    () => accounts.filter((a) => a.type === 'credit_card' && a.credit_limit != null),
    [accounts]
  );

  // Per-CC projected limit
  const ccProjections = useMemo(() => {
    return ccAccountsWithLimit.map((account) => {
      const accountInstallments = installments.filter((i) => i.account_id === account.id);
      const accountCommitments = commitments.filter((c) => c.account_id === account.id);
      const totalObligation = calculateTotalMonthlyObligation(accountInstallments, accountCommitments);
      const projected = calculateProjectedEffectiveLimit(
        account.credit_limit!,
        totalObligation,
        account.balance
      );
      return { account, totalObligation, projected };
    });
  }, [ccAccountsWithLimit, installments, commitments]);

  // Top 3 active installments sorted by remaining tenor ascending (closest to finish first)
  const topInstallments = useMemo(() => {
    return [...installments]
      .map((i) => ({
        installment: i,
        remainingTenor: calculateRemainingTenor(new Date(i.start_date), i.tenor_months, today),
      }))
      .sort((a, b) => a.remainingTenor - b.remainingTenor)
      .slice(0, 3);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments]);

  if (isLoading) return null;
  if (installments.length === 0 && commitments.length === 0) return null;

  return (
    <Card className="!p-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[11px] text-text-secondary font-medium">Cicilan &amp; Komitmen</p>
        <Link href="/commitments" className="text-[11px] text-primary hover:underline">
          Lihat Detail
        </Link>
      </div>

      {/* Total monthly obligation */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <span className="text-[11px] text-text-secondary">Total Kewajiban Bulanan</span>
        <span className="text-[11px] font-bold text-text-primary">
          {formatIDR(totalMonthlyObligation)}
        </span>
      </div>

      {/* Per-CC projected limit */}
      {ccProjections.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {ccProjections.map(({ account, projected }) => {
            const isNegative = projected < 0;
            const isLow =
              !isNegative &&
              account.credit_limit != null &&
              projected < account.credit_limit * 0.1;
            return (
              <div key={account.id} className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary truncate max-w-[55%]">
                  {account.name} — Prediksi Sisa Limit
                </span>
                <span
                  className={`text-[11px] font-semibold shrink-0 ${
                    isNegative
                      ? 'text-danger'
                      : isLow
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-text-primary'
                  }`}
                >
                  {isNegative && '⚠️ '}
                  {formatIDR(projected)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top installments with progress */}
      {topInstallments.length > 0 && (
        <div className="space-y-2">
          {topInstallments.map(({ installment, remainingTenor }) => {
            const currentNum = calculateCurrentInstallmentNumber(
              installment.tenor_months,
              remainingTenor
            );
            const progressPct = Math.round((currentNum / installment.tenor_months) * 100);

            return (
              <div key={installment.id}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] text-text-primary font-medium truncate max-w-[65%]">
                    {installment.name}
                  </span>
                  <span className="text-[11px] text-text-secondary shrink-0">
                    {currentNum}/{installment.tenor_months}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${installment.name}: cicilan ke-${currentNum} dari ${installment.tenor_months}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
