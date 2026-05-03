'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import BudgetProgressBar from '@/components/budgets/BudgetProgressBar';
import BudgetHealthIndicator from '@/components/budgets/BudgetHealthIndicator';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useBudgets } from '@/hooks/useBudgets';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import { useNetWorth } from '@/hooks/useNetWorth';
import { getCycleRange, getCycleBudgetMonth } from '@/lib/cycle-utils';

export default function BudgetProgressSection() {
  const formatIDR = useFormatIDR();
  const { cutoffDate } = useCutoffDate();
  const { breakdown } = useNetWorth();
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

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <Card className="!p-3">
      <p className="text-[11px] text-text-secondary mb-2">{budgetLabel}</p>

      {/* Health indicator compact */}
      <div className="mb-2">
        <BudgetHealthIndicator
          totalBudget={totalBudget}
          cashBalance={breakdown.cash}
          creditCardDebt={breakdown.creditCardDebt}
          totalSpent={totalSpent}
          compact
        />
      </div>

      <div className="space-y-2">
        {budgets.map((budget) => {
          const categoryName = budget.category?.name ?? 'Kategori';
          const categoryIcon = budget.category?.icon ?? '📦';
          const remaining = budget.limit_amount - budget.spent;
          return (
            <div key={budget.id}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] text-text-primary">
                  {categoryIcon} {categoryName}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {formatIDR(budget.spent)} / {formatIDR(budget.limit_amount)}
                </span>
              </div>
              <BudgetProgressBar
                spent={budget.spent}
                limit={budget.limit_amount}
                status={budget.status}
              />
              <p className={`text-[10px] mt-0.5 ${remaining < 0 ? 'text-danger' : 'text-text-muted'}`}>
                Sisa: {formatIDR(remaining)}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
