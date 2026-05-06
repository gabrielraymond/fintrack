'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import BudgetCard from '@/components/budgets/BudgetCard';
import BudgetForm from '@/components/budgets/BudgetForm';
import DeleteBudgetDialog from '@/components/budgets/DeleteBudgetDialog';
import BudgetHealthIndicator from '@/components/budgets/BudgetHealthIndicator';
import {
  useBudgets,
  useBudgetedCategoryIds,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/useBudgets';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import { useCarryOverBudgets } from '@/hooks/useCarryOverBudgets';
import { useNetWorth } from '@/hooks/useNetWorth';
import { getCycleRange, getCycleBudgetMonth, getCycleRangeForMonth } from '@/lib/cycle-utils';
import type { BudgetWithSpending } from '@/types';

function getDefaultMonthDate(cutoffDate: number = 1): string {
  const cycleRange = getCycleRange(cutoffDate);
  return getCycleBudgetMonth(cycleRange); // "YYYY-MM-01"
}

function formatMonthInput(monthDate: string): string {
  return monthDate.slice(0, 7);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${MONTH_NAMES[parseInt(m, 10) - 1]}`;
}

type BudgetSort = 'usage-desc' | 'usage-asc' | 'limit-desc' | 'remaining-asc' | 'name-asc';

const SORT_OPTIONS: { value: BudgetSort; label: string }[] = [
  { value: 'usage-desc', label: 'Pemakaian ↓' },
  { value: 'usage-asc', label: 'Pemakaian ↑' },
  { value: 'remaining-asc', label: 'Sisa terkecil' },
  { value: 'limit-desc', label: 'Limit terbesar' },
  { value: 'name-asc', label: 'Nama A-Z' },
];

function sortBudgets(budgets: BudgetWithSpending[], sort: BudgetSort): BudgetWithSpending[] {
  const sorted = [...budgets];
  switch (sort) {
    case 'usage-desc':
      return sorted.sort((a, b) => {
        const ra = a.limit_amount > 0 ? a.spent / a.limit_amount : 0;
        const rb = b.limit_amount > 0 ? b.spent / b.limit_amount : 0;
        return rb - ra;
      });
    case 'usage-asc':
      return sorted.sort((a, b) => {
        const ra = a.limit_amount > 0 ? a.spent / a.limit_amount : 0;
        const rb = b.limit_amount > 0 ? b.spent / b.limit_amount : 0;
        return ra - rb;
      });
    case 'remaining-asc':
      return sorted.sort((a, b) => (a.limit_amount - a.spent) - (b.limit_amount - b.spent));
    case 'limit-desc':
      return sorted.sort((a, b) => b.limit_amount - a.limit_amount);
    case 'name-asc':
      return sorted.sort((a, b) => (a.category?.name ?? '').localeCompare(b.category?.name ?? ''));
    default:
      return sorted;
  }
}

export default function BudgetsPage() {
  const { cutoffDate, isReady: cutoffReady } = useCutoffDate();
  const [month, setMonth] = useState(() => getDefaultMonthDate());
  const [monthInitialized, setMonthInitialized] = useState(false);

  // Update default month once cutoffDate is loaded from server
  useEffect(() => {
    if (!monthInitialized && cutoffReady) {
      setMonth(getDefaultMonthDate(cutoffDate));
      setMonthInitialized(true);
    }
  }, [cutoffDate, cutoffReady, monthInitialized]);

  const { data: budgets, isLoading, error, refetch } = useBudgets(month, cutoffDate);
  const budgetedCategoryIds = useBudgetedCategoryIds(month);

  // Auto carry-over recurring budgets when page loads
  useCarryOverBudgets(month, cutoffDate);

  const { breakdown } = useNetWorth();

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpending | null>(null);
  const [sort, setSort] = useState<BudgetSort>('usage-desc');

  const sortedBudgets = useMemo(
    () => budgets ? sortBudgets(budgets, sort) : [],
    [budgets, sort],
  );

  const handleCreate = (data: { category_id: string; month: string; limit_amount: number; is_recurring: boolean }) => {
    createBudget.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEdit = (data: { category_id: string; month: string; limit_amount: number; is_recurring: boolean }) => {
    if (!editingBudget) return;
    updateBudget.mutate(
      { id: editingBudget.id, limit_amount: data.limit_amount, month: data.month, is_recurring: data.is_recurring },
      { onSuccess: () => setEditingBudget(null) },
    );
  };

  const handleDeleteThisMonth = () => {
    if (!deleteTarget) return;
    deleteBudget.mutate(
      { budgetId: deleteTarget.id, categoryId: deleteTarget.category_id, stopRecurring: false },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  const handleDeleteAndStopRecurring = () => {
    if (!deleteTarget) return;
    deleteBudget.mutate(
      { budgetId: deleteTarget.id, categoryId: deleteTarget.category_id, stopRecurring: true },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "2024-03"
    if (val) {
      setMonth(`${val}-01`);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading text-text-primary">Anggaran</h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          Tambah Anggaran
        </Button>
      </div>

      {/* Month picker */}
      <div className="mb-4">
        <label htmlFor="budget-month-filter" className="block text-caption text-text-secondary mb-1">
          Bulan
        </label>
        <input
          id="budget-month-filter"
          type="month"
          value={formatMonthInput(month)}
          onChange={handleMonthChange}
          className="px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
        />
        {cutoffDate > 1 && (() => {
          const range = getCycleRangeForMonth(month, cutoffDate);
          const endDate = new Date(range.end);
          endDate.setDate(endDate.getDate() - 1);
          const displayEnd = endDate.toISOString().split('T')[0];
          return (
            <p className="text-small text-text-muted mt-1">
              Periode: {formatShortDate(range.start)} – {formatShortDate(displayEnd)}
            </p>
          );
        })()}
      </div>

      {/* Budget Health Indicator */}
      {budgets && budgets.length > 0 && (
        <div className="mb-4">
          <BudgetHealthIndicator
            totalBudget={budgets.reduce((sum, b) => sum + b.limit_amount, 0)}
            totalSpent={budgets.reduce((sum, b) => sum + b.spent, 0)}
            cashBalance={breakdown.cash}
            creditCardDebt={breakdown.creditCardDebt}
          />
        </div>
      )}

      {/* Sort */}
      {budgets && budgets.length > 1 && (
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="budget-sort" className="text-caption text-text-secondary">Urutkan:</label>
          <select
            id="budget-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as BudgetSort)}
            className="px-2 py-1 border border-border rounded-lg text-caption text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4" role="status" aria-label="Memuat anggaran...">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="8rem" shape="rect" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          message="Gagal memuat daftar anggaran. Silakan coba lagi."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && (!budgets || budgets.length === 0) && (
        <EmptyState
          title="Belum ada anggaran"
          description="Buat anggaran untuk mengontrol pengeluaran bulanan Anda."
          actionLabel="Tambah Anggaran"
          onAction={() => setFormOpen(true)}
        />
      )}

      {/* Budget cards */}
      {!isLoading && !error && sortedBudgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {sortedBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={(b) => setEditingBudget(b)}
              onDelete={(b) => setDeleteTarget(b)}
            />
          ))}
        </div>
      )}

      {/* Create form */}
      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createBudget.isPending}
        budgetedCategoryIds={budgetedCategoryIds}
        cutoffDate={cutoffDate}
      />

      {/* Edit form */}
      <BudgetForm
        open={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSubmit={handleEdit}
        loading={updateBudget.isPending}
        budget={editingBudget}
        cutoffDate={cutoffDate}
      />

      {/* Delete confirmation */}
      <DeleteBudgetDialog
        open={!!deleteTarget}
        budget={deleteTarget}
        loading={deleteBudget.isPending}
        onDeleteThisMonth={handleDeleteThisMonth}
        onDeleteAndStopRecurring={handleDeleteAndStopRecurring}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
