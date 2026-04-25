'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useBudgets } from '@/hooks/useBudgets';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import { getCycleRange, getCycleBudgetMonth } from '@/lib/cycle-utils';

export default function BudgetProgressSection() {
  const formatIDR = useFormatIDR();
  const { cutoffDate } = useCutoffDate();
  const cycleRange = getCycleRange(cutoffDate);
  const budgetMonth = getCycleBudgetMonth(cycleRange);
  const { data: budgets, isLoading } = useBudgets(budgetMonth, cutoffDate);

  if (isLoading) return null;
  if (!budgets || budgets.length === 0) return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formatDay = (s: string) => { const [, m, d] = s.split('-'); return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`; };
  const endDate = new Date(cycleRange.end);
  endDate.setDate(endDate.getDate() - 1);
  const displayEnd = endDate.toISOString().split('T')[0];
  const budgetLabel = cutoffDate === 1
    ? 'Anggaran Bulan Ini'
    : `Anggaran ${formatDay(cycleRange.start)} – ${formatDay(displayEnd)}`;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">{budgetLabel}</p>
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
