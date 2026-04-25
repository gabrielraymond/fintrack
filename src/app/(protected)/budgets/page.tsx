'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import BudgetCard from '@/components/budgets/BudgetCard';
import BudgetForm from '@/components/budgets/BudgetForm';
import {
  useBudgets,
  useBudgetedCategoryIds,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/hooks/useBudgets';
import { useCutoffDate } from '@/hooks/useCutoffDate';
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

export default function BudgetsPage() {
  const { cutoffDate } = useCutoffDate();
  const [month, setMonth] = useState(() => getDefaultMonthDate());
  const [monthInitialized, setMonthInitialized] = useState(false);

  // Update default month once cutoffDate is loaded
  useEffect(() => {
    if (!monthInitialized) {
      setMonth(getDefaultMonthDate(cutoffDate));
      setMonthInitialized(true);
    }
  }, [cutoffDate, monthInitialized]);

  const { data: budgets, isLoading, error, refetch } = useBudgets(month, cutoffDate);
  const budgetedCategoryIds = useBudgetedCategoryIds(month);

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpending | null>(null);

  const handleCreate = (data: { category_id: string; month: string; limit_amount: number }) => {
    createBudget.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleEdit = (data: { category_id: string; month: string; limit_amount: number }) => {
    if (!editingBudget) return;
    updateBudget.mutate(
      { id: editingBudget.id, limit_amount: data.limit_amount, month: data.month },
      { onSuccess: () => setEditingBudget(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteBudget.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
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
      {!isLoading && !error && budgets && budgets.length > 0 && (
        <div className="space-y-4">
          {budgets.map((budget) => (
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
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Anggaran"
        description={`Apakah Anda yakin ingin menghapus anggaran untuk "${deleteTarget?.category?.name ?? 'kategori ini'}"?`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
