'use client';

import React, { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import { useCashFlowTransactions } from '@/hooks/useCashFlowTransactions';
import {
  canNavigateCashFlowNext,
  getPreviousCashFlowPeriod,
  getNextCashFlowPeriod,
} from '@/lib/cashflow-utils';
import CashFlowPeriodSelector from '@/components/dashboard/CashFlowPeriodSelector';
import CashFlowSummary from '@/components/dashboard/CashFlowSummary';
import { getCycleRange, getCycleBudgetMonth, type CycleRange } from '@/lib/cycle-utils';
import type { Transaction } from '@/types';

// ── Indonesian short month names ────────────────────────────

const MONTH_NAMES_SHORT: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// ── Types ────────────────────────────────────────────────────

export interface DailyData {
  label: string;      // "25" or "1 Feb" (when month changes)
  fullDate: string;   // "YYYY-MM-DD" for tooltip
  Pemasukan: number;
  Pengeluaran: number;
}

// ── buildDailyData ──────────────────────────────────────────

/**
 * Builds daily aggregated data from transactions within a cycle range.
 *
 * - Groups transactions by date, summing income and expense amounts
 * - Skips transfer transactions
 * - Labels show just the day number, except on the first day of a new month
 *   within the range, where the short month name is appended (e.g., "1 Feb")
 * - fullDate provides the YYYY-MM-DD string for tooltip display
 *
 * Requirements: 2.4, 4.1, 4.2
 */
export function buildDailyData(
  transactions: Transaction[],
  cycleRange: CycleRange,
): DailyData[] {
  // Determine the start month to detect cross-month boundaries
  const startMonth = parseInt(cycleRange.start.slice(5, 7), 10); // 1-based

  const byDate: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    if (tx.type === 'transfer') continue;
    // Only include transactions within the cycle range
    if (tx.date < cycleRange.start || tx.date >= cycleRange.end) continue;

    const dateKey = tx.date.slice(0, 10); // YYYY-MM-DD
    if (!byDate[dateKey]) byDate[dateKey] = { income: 0, expense: 0 };
    if (tx.type === 'income') byDate[dateKey].income += tx.amount;
    else if (tx.type === 'expense') byDate[dateKey].expense += tx.amount;
  }

  return Object.keys(byDate)
    .sort()
    .map((dateKey) => {
      const dayNum = parseInt(dateKey.slice(8, 10), 10);
      const monthNum = parseInt(dateKey.slice(5, 7), 10); // 1-based

      // Show month name on the first day of a different month than the start
      let label: string;
      if (monthNum !== startMonth && dayNum === 1) {
        label = `1 ${MONTH_NAMES_SHORT[monthNum - 1]}`;
      } else {
        label = String(dayNum);
      }

      return {
        label,
        fullDate: dateKey,
        Pemasukan: byDate[dateKey].income,
        Pengeluaran: byDate[dateKey].expense,
      };
    });
}

// ── CashFlowChart ───────────────────────────────────────────

/**
 * Self-contained cash flow chart component.
 * Manages its own period state and fetches transaction data internally.
 *
 * Requirements: 1.1, 1.2, 2.3, 3.4, 4.3, 4.4
 */
export default function CashFlowChart() {
  const formatIDR = useFormatIDR();
  const { cutoffDate, isLoading: cutoffLoading, isReady: cutoffReady } = useCutoffDate();

  // Initialize to current period based on cutoff date
  const [period, setPeriod] = useState(() => {
    const cycleRange = getCycleRange(cutoffDate);
    const budgetMonth = getCycleBudgetMonth(cycleRange); // "YYYY-MM-01"
    const month = parseInt(budgetMonth.slice(5, 7), 10) - 1; // 0-indexed
    const year = parseInt(budgetMonth.slice(0, 4), 10);
    return { month, year };
  });
  const [periodInitialized, setPeriodInitialized] = useState(false);

  // Re-initialize period once cutoffDate is loaded from server
  React.useEffect(() => {
    if (!periodInitialized && cutoffReady) {
      const cycleRange = getCycleRange(cutoffDate);
      const budgetMonth = getCycleBudgetMonth(cycleRange);
      const month = parseInt(budgetMonth.slice(5, 7), 10) - 1;
      const year = parseInt(budgetMonth.slice(0, 4), 10);
      setPeriod({ month, year });
      setPeriodInitialized(true);
    }
  }, [cutoffDate, cutoffReady, periodInitialized]);

  const { data: transactions, isLoading: txLoading, cycleRange } = useCashFlowTransactions({
    month: period.month,
    year: period.year,
    cutoffDate,
  });

  const data = useMemo(
    () => (transactions ? buildDailyData(transactions, cycleRange) : []),
    [transactions, cycleRange],
  );

  const summary = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, netChange: 0 };
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'expense') totalExpenses += tx.amount;
    }
    return { totalIncome, totalExpenses, netChange: totalIncome - totalExpenses };
  }, [transactions]);

  const canGoNext = canNavigateCashFlowNext(period.month, period.year, cutoffDate);

  const handlePrevious = () => {
    setPeriod((prev) => getPreviousCashFlowPeriod(prev.month, prev.year));
  };

  const handleNext = () => {
    if (canGoNext) {
      setPeriod((prev) => getNextCashFlowPeriod(prev.month, prev.year));
    }
  };

  // Loading state
  if (cutoffLoading || txLoading) {
    return (
      <Card className="!p-3">
        <p className="text-[11px] text-text-secondary mb-2">Arus Kas</p>
        <SkeletonLoader height="1.5rem" shape="rect" className="mb-2" />
        <SkeletonLoader height="2rem" shape="rect" className="mb-2" />
        <SkeletonLoader height="10rem" shape="rect" />
      </Card>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="!p-3">
        <p className="text-[11px] text-text-secondary mb-2">Arus Kas</p>
        <CashFlowPeriodSelector
          month={period.month}
          year={period.year}
          cutoffDate={cutoffDate}
          cycleRange={cycleRange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoNext={canGoNext}
        />
        <p className="text-caption text-text-muted text-center py-6">
          Belum ada transaksi untuk periode {cycleRange.start} s/d {cycleRange.end}
        </p>
      </Card>
    );
  }

  return (
    <Card className="!p-3">
      <p className="text-[11px] text-text-secondary mb-1">Arus Kas</p>

      <CashFlowPeriodSelector
        month={period.month}
        year={period.year}
        cutoffDate={cutoffDate}
        cycleRange={cycleRange}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoNext={canGoNext}
      />

      <CashFlowSummary
        totalIncome={summary.totalIncome}
        totalExpenses={summary.totalExpenses}
        netChange={summary.netChange}
      />

      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                return String(v);
              }}
              width={40}
            />
            <Tooltip
              formatter={(value) => formatIDR(Number(value))}
              labelFormatter={(_label, payload) => {
                if (payload && payload.length > 0) {
                  const fullDate = (payload[0].payload as DailyData).fullDate;
                  return `Tanggal ${fullDate}`;
                }
                return `Tanggal ${String(_label)}`;
              }}
            />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
