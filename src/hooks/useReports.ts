'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Transaction, Category } from '@/types';
import {
  calculateReportSummary,
  calculateCategoryExpenses,
  calculateMonthlyTrend,
  calculateMonthOverMonth,
  calculateYearlySummary,
  getPreviousMonth,
  type ReportSummary,
  type CategoryExpense,
  type MonthlyTrendData,
  type ComparisonMetric,
  type YearlySummaryData,
} from '@/lib/report-utils';

// ── Types ───────────────────────────────────────────────────

export type ReportView = 'monthly' | 'yearly';

export interface UseReportsParams {
  month: number; // 0-11
  year: number;
  view: ReportView;
}

export interface UseReportsResult {
  summary: ReportSummary | null;
  categoryExpenses: CategoryExpense[];
  trendData: MonthlyTrendData[];
  comparison: ComparisonMetric[];
  yearlySummary: YearlySummaryData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ── Query Keys ──────────────────────────────────────────────

export const reportKeys = {
  all: ['reports'] as const,
  monthly: (userId: string, month: number, year: number) =>
    [...reportKeys.all, 'monthly', userId, month, year] as const,
  yearly: (userId: string, year: number) =>
    [...reportKeys.all, 'yearly', userId, year] as const,
};

// ── Data Fetchers ───────────────────────────────────────────

interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, 'id' | 'name' | 'icon'> | null;
}

/**
 * Fetches transactions for a date range, joining categories and filtering
 * out soft-deleted accounts. RLS handles user isolation automatically.
 */
async function fetchTransactions(
  userId: string,
  dateStart: string,
  dateEnd: string,
): Promise<TransactionWithCategory[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, icon), accounts!inner(id)')
    .eq('user_id', userId)
    .gte('date', dateStart)
    .lt('date', dateEnd)
    .eq('accounts.is_deleted', false)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as unknown as TransactionWithCategory[]) ?? [];
}

/**
 * Fetches all categories for the user (needed for category name/icon mapping).
 */
async function fetchCategories(userId: string): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data as Category[]) ?? [];
}

// ── Date Helpers ────────────────────────────────────────────

function getMonthDateRange(month: number, year: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;
  return { start, end };
}

function getTrendDateRange(month: number, year: number, months: number) {
  // Go back (months - 1) months from the selected month
  let m = month;
  let y = year;
  for (let i = 0; i < months - 1; i++) {
    const prev = getPreviousMonth(m, y);
    m = prev.month;
    y = prev.year;
  }
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;

  // End is the first day of the month after the selected month
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;
  return { start, end };
}

function getYearDateRange(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year + 1}-01-01`,
  };
}

// ── Hook ────────────────────────────────────────────────────

/**
 * Fetches and aggregates report data for the selected period.
 * Monthly view: current month transactions + 6-month trend + previous month for MoM comparison.
 * Yearly view: full calendar year transactions.
 * Requirements: 10.1, 11.1, 11.2
 */
export function useReports({ month, year, view }: UseReportsParams): UseReportsResult {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  // ── Monthly queries ─────────────────────────────────────
  const monthRange = useMemo(() => getMonthDateRange(month, year), [month, year]);
  const trendRange = useMemo(() => getTrendDateRange(month, year, 6), [month, year]);
  const prevMonth = useMemo(() => getPreviousMonth(month, year), [month, year]);
  const prevMonthRange = useMemo(
    () => getMonthDateRange(prevMonth.month, prevMonth.year),
    [prevMonth],
  );

  // Current month transactions
  const monthlyQuery = useQuery({
    queryKey: reportKeys.monthly(userId, month, year),
    queryFn: () => fetchTransactions(userId, monthRange.start, monthRange.end),
    enabled: !!user && view === 'monthly',
    retry: 1,
  });

  // 6-month trend transactions
  const trendQuery = useQuery({
    queryKey: [...reportKeys.all, 'trend', userId, month, year],
    queryFn: () => fetchTransactions(userId, trendRange.start, trendRange.end),
    enabled: !!user && view === 'monthly',
    retry: 1,
  });

  // Previous month transactions (for MoM comparison)
  const prevMonthQuery = useQuery({
    queryKey: reportKeys.monthly(userId, prevMonth.month, prevMonth.year),
    queryFn: () =>
      fetchTransactions(userId, prevMonthRange.start, prevMonthRange.end),
    enabled: !!user && view === 'monthly',
    retry: 1,
  });

  // Categories (needed for category names/icons)
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'list', userId],
    queryFn: () => fetchCategories(userId),
    enabled: !!user,
    retry: 1,
  });

  // ── Yearly query ────────────────────────────────────────
  const yearRange = useMemo(() => getYearDateRange(year), [year]);

  const yearlyQuery = useQuery({
    queryKey: reportKeys.yearly(userId, year),
    queryFn: () => fetchTransactions(userId, yearRange.start, yearRange.end),
    enabled: !!user && view === 'yearly',
    retry: 1,
  });

  // ── Aggregations ────────────────────────────────────────
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  // Strip joined category data back to plain Transaction for util functions
  const toTransactions = (data: TransactionWithCategory[] | undefined): Transaction[] =>
    (data ?? []).map(({ categories: _cat, ...rest }) => rest as unknown as Transaction); // eslint-disable-line @typescript-eslint/no-unused-vars

  const summary = useMemo<ReportSummary | null>(() => {
    if (view !== 'monthly' || !monthlyQuery.data) return null;
    return calculateReportSummary(toTransactions(monthlyQuery.data));
  }, [view, monthlyQuery.data]);

  const categoryExpenses = useMemo<CategoryExpense[]>(() => {
    if (view !== 'monthly' || !monthlyQuery.data) return [];
    return calculateCategoryExpenses(toTransactions(monthlyQuery.data), categories);
  }, [view, monthlyQuery.data, categories]);

  const trendData = useMemo<MonthlyTrendData[]>(() => {
    if (view !== 'monthly' || !trendQuery.data) return [];
    return calculateMonthlyTrend(toTransactions(trendQuery.data), 6, month, year);
  }, [view, trendQuery.data, month, year]);

  const comparison = useMemo<ComparisonMetric[]>(() => {
    if (view !== 'monthly' || !monthlyQuery.data || !prevMonthQuery.data) return [];
    return calculateMonthOverMonth(
      toTransactions(monthlyQuery.data),
      toTransactions(prevMonthQuery.data),
    );
  }, [view, monthlyQuery.data, prevMonthQuery.data]);

  const yearlySummary = useMemo<YearlySummaryData | null>(() => {
    if (view !== 'yearly' || !yearlyQuery.data) return null;
    return calculateYearlySummary(toTransactions(yearlyQuery.data), year);
  }, [view, yearlyQuery.data, year]);

  // ── Loading / Error ─────────────────────────────────────
  const isLoading =
    view === 'monthly'
      ? monthlyQuery.isLoading || trendQuery.isLoading || prevMonthQuery.isLoading || categoriesQuery.isLoading
      : yearlyQuery.isLoading || categoriesQuery.isLoading;

  const error =
    (view === 'monthly'
      ? monthlyQuery.error || trendQuery.error || prevMonthQuery.error || categoriesQuery.error
      : yearlyQuery.error || categoriesQuery.error) as Error | null;

  const refetch = () => {
    if (view === 'monthly') {
      monthlyQuery.refetch();
      trendQuery.refetch();
      prevMonthQuery.refetch();
    } else {
      yearlyQuery.refetch();
    }
    categoriesQuery.refetch();
  };

  return {
    summary,
    categoryExpenses,
    trendData,
    comparison,
    yearlySummary,
    isLoading,
    error,
    refetch,
  };
}
