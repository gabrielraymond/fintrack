'use client';

import React from 'react';
import type { BudgetStatus } from '@/types';

export interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  status: BudgetStatus;
}

const statusColors: Record<BudgetStatus, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
};

export default function BudgetProgressBar({
  spent,
  limit,
  status,
}: BudgetProgressBarProps) {
  const ratio = limit > 0 ? spent / limit : 0;
  const percentage = Math.min(Math.round(ratio * 100), 100);

  return (
    <div
      className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Penggunaan anggaran ${percentage}%`}
    >
      <div
        className={`h-full rounded-full transition-all ${statusColors[status]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
