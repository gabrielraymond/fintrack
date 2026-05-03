'use client';

import React from 'react';
import { formatCashFlowPeriodLabel } from '@/lib/cashflow-utils';
import { type CycleRange } from '@/lib/cycle-utils';

export interface CashFlowPeriodSelectorProps {
  month: number;        // 0-11
  year: number;
  cutoffDate: number;
  cycleRange: CycleRange;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

export default function CashFlowPeriodSelector({
  cutoffDate,
  cycleRange,
  onPrevious,
  onNext,
  canGoNext,
}: CashFlowPeriodSelectorProps) {
  const label = formatCashFlowPeriodLabel(cycleRange, cutoffDate);

  return (
    <div className="flex items-center justify-between" role="group" aria-label="Navigasi periode arus kas">
      <button
        type="button"
        onClick={onPrevious}
        className="p-2 rounded-lg text-text-primary hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Periode sebelumnya"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <span className="text-subheading font-semibold text-text-primary" aria-live="polite">
        {label}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
          canGoNext
            ? 'text-text-primary hover:bg-surface-secondary'
            : 'text-text-tertiary opacity-50 cursor-not-allowed'
        }`}
        aria-label="Periode berikutnya"
        aria-disabled={!canGoNext}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7.5 5L12.5 10L7.5 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
