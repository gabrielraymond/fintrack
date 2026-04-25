'use client';

import React, { useState } from 'react';
import PeriodSelector from '@/components/reports/PeriodSelector';
import ViewToggle from '@/components/reports/ViewToggle';
import ReportSummaryCard from '@/components/reports/ReportSummaryCard';
import ExpensePieChart from '@/components/reports/ExpensePieChart';
import CategoryBreakdown from '@/components/reports/CategoryBreakdown';
import IncomeExpenseTrendChart from '@/components/reports/IncomeExpenseTrendChart';
import MonthOverMonthComparison from '@/components/reports/MonthOverMonthComparison';
import YearlySummaryView from '@/components/reports/YearlySummaryView';
import ReportSkeletonLoader from '@/components/reports/ReportSkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useReports } from '@/hooks/useReports';
import type { ReportView } from '@/hooks/useReports';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import {
  canNavigateNext,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/report-utils';

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [view, setView] = useState<ReportView>('monthly');
  const { cutoffDate } = useCutoffDate();

  const {
    summary,
    categoryExpenses,
    trendData,
    comparison,
    yearlySummary,
    isLoading,
    error,
    refetch,
  } = useReports({ month, year, view, cutoffDate });

  const handlePrevious = () => {
    const prev = getPreviousMonth(month, year);
    setMonth(prev.month);
    setYear(prev.year);
  };

  const handleNext = () => {
    if (canNavigateNext(month, year)) {
      const next = getNextMonth(month, year);
      setMonth(next.month);
      setYear(next.year);
    }
  };

  const handleViewChange = (newView: ReportView) => {
    setView(newView);
  };

  // Determine if data is empty (no transactions for the period)
  const isEmptyMonthly = !isLoading && !error && view === 'monthly' && summary !== null
    && summary.totalIncome === 0 && summary.totalExpenses === 0;
  const isEmptyYearly = !isLoading && !error && view === 'yearly' && yearlySummary !== null
    && yearlySummary.totalIncome === 0 && yearlySummary.totalExpenses === 0;
  const isEmpty = isEmptyMonthly || isEmptyYearly;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-heading text-text-primary">Laporan</h1>

      <ViewToggle activeView={view} onViewChange={handleViewChange} />

      {view === 'monthly' && (
        <PeriodSelector
          month={month}
          year={year}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoNext={canNavigateNext(month, year)}
        />
      )}

      {error && !isLoading && (
        <ErrorState
          message="Gagal memuat data laporan. Silakan coba lagi."
          onRetry={refetch}
        />
      )}

      {isLoading && <ReportSkeletonLoader />}

      {isEmpty && (
        <EmptyState
          title="Belum ada data"
          description="Belum ada data untuk periode ini"
        />
      )}

      {!isLoading && !error && !isEmpty && view === 'monthly' && summary && (
        <>
          <ReportSummaryCard
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            netChange={summary.netChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExpensePieChart
              data={categoryExpenses}
              totalExpenses={summary.totalExpenses}
            />
            <CategoryBreakdown data={categoryExpenses} />
          </div>

          <IncomeExpenseTrendChart data={trendData} />

          {comparison.length > 0 && (
            <MonthOverMonthComparison metrics={comparison} />
          )}
        </>
      )}

      {!isLoading && !error && !isEmpty && view === 'yearly' && yearlySummary && (
        <YearlySummaryView data={yearlySummary} />
      )}
    </div>
  );
}
