'use client';

import { useMemo } from 'react';
import { useAccounts } from './useAccounts';
import { partitionAccounts, sumBalance } from '@/lib/accountClassifier';
import type { Account } from '@/types';

/**
 * Computes net worth as the sum of all active account balances.
 * Credit card balances are stored as negative, so they naturally subtract.
 * Requirements: 8.1, 19.1, 19.2
 */
export function calculateNetWorth(accounts: Account[]): number {
  return accounts
    .filter((a) => !a.is_deleted)
    .reduce((sum, account) => sum + account.balance, 0);
}

export interface NetWorthBreakdown {
  total: number;
  operational: number;
  savings: number;
}

/**
 * Computes net worth breakdown by account classification.
 * Invariant: total === operational + savings
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function calculateNetWorthBreakdown(accounts: Account[]): NetWorthBreakdown {
  const active = accounts.filter((a) => !a.is_deleted);
  const { operational, savings } = partitionAccounts(active);
  return {
    total: sumBalance(active),
    operational: sumBalance(operational),
    savings: sumBalance(savings),
  };
}

export function useNetWorth() {
  const { data, isLoading, error, refetch } = useAccounts(0);
  const accounts = useMemo(() => data?.data ?? [], [data?.data]);

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);
  const breakdown = useMemo(() => calculateNetWorthBreakdown(accounts), [accounts]);

  return { netWorth, breakdown, accounts, isLoading, error, refetch };
}
