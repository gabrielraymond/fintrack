'use client';

import React from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import type { TransactionFilters as TFilters } from '@/types';

interface TransactionFiltersProps {
  filters: TFilters;
  onFilterChange: (filters: TFilters) => void;
}

export default function TransactionFilters({
  filters,
  onFilterChange,
}: TransactionFiltersProps) {
  const { data: accountsData } = useAccounts(0);
  const { data: categories } = useCategories();

  const accounts = accountsData?.data ?? [];

  const handleChange = (key: keyof TFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const hasActiveFilters =
    filters.accountId || filters.categoryId || filters.type || filters.month;

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Account filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label htmlFor="filter-account" className="text-caption text-text-muted">
          Akun
        </label>
        <select
          id="filter-account"
          value={filters.accountId ?? ''}
          onChange={(e) => handleChange('accountId', e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter berdasarkan akun"
        >
          <option value="">Semua akun</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label htmlFor="filter-category" className="text-caption text-text-muted">
          Kategori
        </label>
        <select
          id="filter-category"
          value={filters.categoryId ?? ''}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter berdasarkan kategori"
        >
          <option value="">Semua kategori</option>
          {(categories ?? []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label htmlFor="filter-type" className="text-caption text-text-muted">
          Tipe
        </label>
        <select
          id="filter-type"
          value={filters.type ?? ''}
          onChange={(e) => handleChange('type', e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter berdasarkan tipe transaksi"
        >
          <option value="">Semua tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      {/* Month filter */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label htmlFor="filter-month" className="text-caption text-text-muted">
          Bulan
        </label>
        <input
          id="filter-month"
          type="month"
          value={filters.month ?? ''}
          onChange={(e) => handleChange('month', e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter berdasarkan bulan"
        />
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg bg-surface-secondary px-3 py-2 text-caption text-text-secondary hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Reset semua filter"
        >
          Reset
        </button>
      )}
    </div>
  );
}
