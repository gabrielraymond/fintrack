'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BudgetProgressBar from './BudgetProgressBar';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { BudgetWithSpending } from '@/types';

export interface BudgetCardProps {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onDelete: (budget: BudgetWithSpending) => void;
}

export default function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const formatIDR = useFormatIDR();
  const remaining = budget.limit_amount - budget.spent;
  const categoryName = budget.category?.name ?? 'Kategori';
  const categoryIcon = budget.category?.icon ?? '📦';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-subheading text-text-primary truncate">
            {categoryIcon} {categoryName}
          </h3>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(budget)}
            aria-label={`Edit anggaran ${categoryName}`}
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(budget)}
            aria-label={`Hapus anggaran ${categoryName}`}
          >
            🗑️
          </Button>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <BudgetProgressBar
          spent={budget.spent}
          limit={budget.limit_amount}
          status={budget.status}
        />

        <div className="flex justify-between text-caption text-text-secondary">
          <span>Terpakai: {formatIDR(budget.spent)}</span>
          <span>Limit: {formatIDR(budget.limit_amount)}</span>
        </div>

        <p
          className={`text-body font-medium ${remaining < 0 ? 'text-danger' : 'text-text-primary'}`}
        >
          Sisa: {formatIDR(remaining)}
        </p>
      </div>
    </Card>
  );
}
