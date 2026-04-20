'use client';

import React from 'react';
import { formatIDR } from '@/lib/formatters';

export interface CreditCardProgressProps {
  balance: number;
  creditLimit: number;
  dueDate: number | null;
}

function isDueDateWithin7Days(dueDate: number): boolean {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Build the next due date
  let dueMonth = currentMonth;
  let dueYear = currentYear;

  // If the due day has already passed this month, use next month
  if (dueDate < currentDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const nextDue = new Date(dueYear, dueMonth, dueDate);
  const diffMs = nextDue.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 7;
}

export default function CreditCardProgress({
  balance,
  creditLimit,
  dueDate,
}: CreditCardProgressProps) {
  const debt = Math.abs(balance);
  const ratio = creditLimit > 0 ? Math.min(debt / creditLimit, 1) : 0;
  const percentage = Math.round(ratio * 100);

  const barColor =
    ratio >= 1 ? 'bg-danger' : ratio >= 0.75 ? 'bg-warning' : 'bg-success';

  const showDueWarning = dueDate !== null && isDueDateWithin7Days(dueDate);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-caption text-text-secondary mb-1">
        <span>Utang: {formatIDR(debt)}</span>
        <span>Limit: {formatIDR(creditLimit)}</span>
      </div>
      <div
        className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Penggunaan kartu kredit ${percentage}%`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showDueWarning && (
        <p className="mt-1 text-small text-warning font-medium" role="alert">
          ⚠ Jatuh tempo dalam 7 hari (tanggal {dueDate})
        </p>
      )}
    </div>
  );
}
