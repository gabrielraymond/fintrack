'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { getCycleRangeForMonth, type CycleRange } from '@/lib/cycle-utils';
import type { Transaction } from '@/types';

// ── Types ───────────────────────────────────────────────────

export interface UseCashFlowTransactionsParams {
  month: number; // 0-11
  year: number;
  cutoffDate: number; // 1-28
}

export interface UseCashFlowTransactionsResult {
  data: Transaction[] | undefined;
  isLoading: boolean;
  error: Error | null;
  cycleRange: CycleRange;
}

// ── Data Fetcher ────────────────────────────────────────────

/**
 * Fetches transactions within a date range, ordered by date ascending.
 * RLS handles user isolation automatically.
 */
async function fetchCashFlowTransactions(
  userId: string,
  dateStart: string,
  dateEnd: string,
): Promise<Transaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', dateStart)
    .lt('date', dateEnd)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data as Transaction[]) ?? [];
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Fetches transactions for a cash flow period based on the budget cycle.
 *
 * Converts month (0-indexed) + year into a budget month string,
 * computes the CycleRange via getCycleRangeForMonth, then queries
 * Supabase for transactions within that range.
 *
 * Requirements: 2.1, 2.3, 5.1, 5.2
 */
export function useCashFlowTransactions({
  month,
  year,
  cutoffDate,
}: UseCashFlowTransactionsParams): UseCashFlowTransactionsResult {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  // Convert 0-indexed month + year to "YYYY-MM-01" format
  const budgetMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const cycleRange = useMemo(
    () => getCycleRangeForMonth(budgetMonth, cutoffDate),
    [budgetMonth, cutoffDate],
  );

  const query = useQuery({
    queryKey: ['transactions', 'cashflow', userId, cycleRange.start, cycleRange.end],
    queryFn: () => fetchCashFlowTransactions(userId, cycleRange.start, cycleRange.end),
    enabled: !!user,
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    cycleRange,
  };
}
