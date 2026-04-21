'use client';

import React from 'react';
import { getFullMonthName } from '@/lib/report-utils';

export interface PeriodSelectorProps {
  month: number;        // 0-11
  year: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;   // false if at current month
}

export default function PeriodSelector({
  month,
  year,
  onPrevious,
  onNext,
  canGoNext,
}: PeriodSelectorProps) {
  const monthName = getFullMonthName(month);
  const label = `${monthName} ${year}`;

  return (
    <div className="flex items-center justify-between" role="group" aria-label="Navigasi periode">
      <button
        type="button"
        onClick={onPrevious}
        className="p-2 rounded-lg text-text-primary hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Bulan sebelumnya"
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
        aria-label="Bulan berikutnya"
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
