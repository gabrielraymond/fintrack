'use client';

import { useMemo } from 'react';
import { useAccounts } from './useAccounts';
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

export function useNetWorth() {
  const { data, isLoading, error, refetch } = useAccounts(0);
  const accounts = data?.data ?? [];

  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);

  return { netWorth, accounts, isLoading, error, refetch };
}
