'use client';

import React, { useState } from 'react';
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
import type { BudgetWithSpending } from '@/types';

function getCurrentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatMonthInput(monthDate: string): string {
  return monthDate.slice(0, 7);
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonthDate());
  const { data: budgets, isLoading, error, refetch } = useBudgets(month);
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
      { id: editingBudget.id, limit_amount: data.limit_amount },
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
    <div className="p-4 max-w-3xl mx-auto">
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
      />

      {/* Edit form */}
      <BudgetForm
        open={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSubmit={handleEdit}
        loading={updateBudget.isPending}
        budget={editingBudget}
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
