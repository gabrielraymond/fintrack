'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useBudgets } from '@/hooks/useBudgets';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function BudgetProgressSection() {
  const formatIDR = useFormatIDR();
  const month = getCurrentMonth();
  const { data: budgets, isLoading } = useBudgets(month);

  if (isLoading) return null;
  if (!budgets || budgets.length === 0) return null;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Anggaran Bulan Ini</p>
      <div className="space-y-3">
        {budgets.map((budget) => {
          const categoryName = budget.category?.name ?? 'Kategori';
          const categoryIcon = budget.category?.icon ?? '📦';
          return (
            <div key={budget.id}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-caption text-text-primary">
                  {categoryIcon} {categoryName}
                </span>
                <span className="text-caption text-text-secondary">
                  {formatIDR(budget.spent)} / {formatIDR(budget.limit_amount)}
                </span>
              </div>
              <BudgetProgressBar
                spent={budget.spent}
                limit={budget.limit_amount}
                status={budget.status}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
