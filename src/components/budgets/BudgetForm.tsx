'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useCategories } from '@/hooks/useCategories';
import type { BudgetWithSpending } from '@/types';
import { getCycleRange, getCycleBudgetMonth } from '@/lib/cycle-utils';

export interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { category_id: string; month: string; limit_amount: number; is_recurring: boolean }) => void;
  loading?: boolean;
  /** Pass a budget to edit; omit for create mode */
  budget?: BudgetWithSpending | null;
  /** Category IDs that already have a budget for the selected month */
  budgetedCategoryIds?: string[];
  /** Cutoff date (1-28) for cycle-aware default month. Defaults to 1. */
  cutoffDate?: number;
}

function getDefaultMonth(cutoffDate: number = 1): string {
  const cycleRange = getCycleRange(cutoffDate);
  const budgetMonth = getCycleBudgetMonth(cycleRange); // "YYYY-MM-01"
  return budgetMonth.slice(0, 7); // "YYYY-MM"
}

function monthInputToDate(monthInput: string): string {
  return `${monthInput}-01`;
}

export default function BudgetForm({
  open,
  onClose,
  onSubmit,
  loading = false,
  budget,
  budgetedCategoryIds = [],
  cutoffDate = 1,
}: BudgetFormProps) {
  const isEdit = !!budget;
  const { data: categories } = useCategories();

  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(getDefaultMonth(cutoffDate));
  const [limitAmount, setLimitAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.category_id);
      // budget.month is "2024-03-01", convert to "2024-03"
      setMonth(budget.month.slice(0, 7));
      setLimitAmount(String(budget.limit_amount));
      setIsRecurring(budget.is_recurring ?? false);
    } else {
      setCategoryId('');
      setMonth(getDefaultMonth(cutoffDate));
      setLimitAmount('');
      setIsRecurring(false);
    }
  }, [budget, open, cutoffDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      category_id: categoryId,
      month: monthInputToDate(month),
      limit_amount: Number(limitAmount) || 0,
      is_recurring: isRecurring,
    });
  };

  const isValid =
    categoryId.length > 0 &&
    month.length > 0 &&
    Number(limitAmount) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Anggaran' : 'Tambah Anggaran'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label htmlFor="budget-category" className="block text-caption text-text-secondary mb-1">
            Kategori
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface disabled:opacity-50"
          >
            <option value="">Pilih kategori</option>
            {(categories ?? []).map((cat) => {
              const isDisabled =
                !isEdit && budgetedCategoryIds.includes(cat.id);
              return (
                <option key={cat.id} value={cat.id} disabled={isDisabled}>
                  {cat.icon} {cat.name}
                  {isDisabled ? ' (sudah ada anggaran)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Month */}
        <div>
          <label htmlFor="budget-month" className="block text-caption text-text-secondary mb-1">
            Bulan
          </label>
          <input
            id="budget-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
          />
        </div>

        {/* Limit Amount */}
        <div>
          <label htmlFor="budget-limit" className="block text-caption text-text-secondary mb-1">
            Batas Anggaran (IDR)
          </label>
          <input
            id="budget-limit"
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
            min={1}
          />
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center gap-2">
          <input
            id="budget-recurring"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="budget-recurring" className="text-body text-text-primary">
            Anggaran Berulang
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            disabled={!isValid}
          >
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
