'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { BudgetWithSpending, BudgetStatus } from '@/types';

export interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onDelete: (budget: BudgetWithSpending) => void;
}

const statusStroke: Record<BudgetStatus, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const statusColor: Record<BudgetStatus, string> = {
  green: 'text-success',
  yellow: 'text-warning',
  red: 'text-danger',
};

export default function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const formatIDR = useFormatIDR();
  const remaining = budget.limit_amount - budget.spent;
  const categoryName = budget.category?.name ?? 'Kategori';
  const categoryIcon = budget.category?.icon ?? '📦';

  const ratio = budget.limit_amount > 0 ? budget.spent / budget.limit_amount : 0;
  const pct = Math.min(Math.round(ratio * 100), 100);

  const size = 48;
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <Card className="!p-3">
      {/* Row 1: Category name + actions */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-caption font-semibold text-text-primary truncate">
          {categoryIcon} {categoryName}
          {budget.is_recurring && (
            <span className="ml-1 text-[10px] font-normal text-text-secondary" title="Berulang">🔄</span>
          )}
        </h3>
        <div className="flex gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(budget)} aria-label={`Edit anggaran ${categoryName}`}>
            ✏️
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(budget)} aria-label={`Hapus anggaran ${categoryName}`}>
            🗑️
          </Button>
        </div>
      </div>

      {/* Row 2: Circle + amounts */}
      <div className="flex items-center gap-2.5">
        {/* Circle */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="currentColor"
              className="text-border/40" strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={statusStroke[budget.status]}
              strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[10px] font-bold ${statusColor[budget.status]}`}>{pct}%</span>
          </div>
        </div>

        {/* Amounts */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex justify-between text-[11px] text-text-secondary">
            <span>{formatIDR(budget.spent)}</span>
            <span>/ {formatIDR(budget.limit_amount)}</span>
          </div>
          <p className={`text-caption font-semibold ${remaining < 0 ? 'text-danger' : 'text-text-primary'}`}>
            Sisa: {formatIDR(remaining)}
          </p>
        </div>
      </div>
    </Card>
  );
}
