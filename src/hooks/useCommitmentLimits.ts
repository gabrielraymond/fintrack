'use client';

import { useMemo } from 'react';
import { useActiveInstallments, useInstallmentPaymentLogs } from '@/hooks/useInstallments';
import { useActiveCommitments } from '@/hooks/useRecurringCommitments';
import {
  calculateTotalMonthlyObligation,
  calculateCurrentEffectiveLimitCC,
  calculateCurrentEffectiveLimitNonCC,
  calculateProjectedEffectiveLimit,
} from '@/lib/limitCalculations';
import type { Account } from '@/types';

// ── Types ───────────────────────────────────────────────────

export interface AccountLimitData {
  accountId: string;
  totalMonthlyObligation: number;
  currentEffectiveLimit: number | null; // null if limit not configured
  projectedEffectiveLimit: number | null;
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Composite hook that calculates Limit_Real_Sekarang and Prediksi_Limit_Tagihan
 * for each account based on active installments, commitments, and payment logs.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3
 */
export function useCommitmentLimits(accounts: Account[]): {
  data: Record<string, AccountLimitData>;
  isLoading: boolean;
} {
  const today = new Date();

  // Format current month as YYYY-MM-01 for payment log queries
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: installments = [], isLoading: installmentsLoading } = useActiveInstallments();
  const { data: commitments = [], isLoading: commitmentsLoading } = useActiveCommitments();
  const { data: paymentLogs = [], isLoading: logsLoading } = useInstallmentPaymentLogs(currentMonth);

  const isLoading = installmentsLoading || commitmentsLoading || logsLoading;

  const data = useMemo<Record<string, AccountLimitData>>(() => {
    if (isLoading) return {};

    const result: Record<string, AccountLimitData> = {};

    for (const account of accounts) {
      // Filter installments and commitments for this account
      const accountInstallments = installments.filter(
        (i) => i.account_id === account.id
      );
      const accountCommitments = commitments.filter(
        (c) => c.account_id === account.id
      );

      const totalMonthlyObligation = calculateTotalMonthlyObligation(
        accountInstallments,
        accountCommitments
      );

      let currentEffectiveLimit: number | null = null;
      let projectedEffectiveLimit: number | null = null;

      if (account.type === 'credit_card' && account.credit_limit != null) {
        currentEffectiveLimit = calculateCurrentEffectiveLimitCC(
          account.credit_limit,
          accountInstallments,
          accountCommitments,
          today
        );
        // Prediksi = balance (sisa limit saat ini) - total kewajiban bulanan
        projectedEffectiveLimit = calculateProjectedEffectiveLimit(
          account.credit_limit,
          totalMonthlyObligation,
          account.balance
        );
      } else if (account.type !== 'credit_card' && account.commitment_limit != null) {
        currentEffectiveLimit = calculateCurrentEffectiveLimitNonCC(
          account.commitment_limit,
          accountInstallments,
          accountCommitments,
          paymentLogs,
          today
        );
        projectedEffectiveLimit = calculateProjectedEffectiveLimit(
          account.commitment_limit,
          totalMonthlyObligation
        );
      }

      result[account.id] = {
        accountId: account.id,
        totalMonthlyObligation,
        currentEffectiveLimit,
        projectedEffectiveLimit,
      };
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, installments, commitments, paymentLogs, isLoading]);

  return { data, isLoading };
}
