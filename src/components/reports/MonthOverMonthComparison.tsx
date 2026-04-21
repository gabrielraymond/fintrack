'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { getComparisonIndicator } from '@/lib/report-utils';
import type { ComparisonMetric } from '@/lib/report-utils';

export interface MonthOverMonthComparisonProps {
  metrics: ComparisonMetric[];
}

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3v10M8 3l4 4M8 3L4 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 13V3M8 13l4-4M8 13L4 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const COLOR_CLASSES: Record<string, string> = {
  green: 'text-success',
  red: 'text-danger',
  neutral: 'text-text-secondary',
};

function ChangeIndicator({
  percentageChange,
  isExpense,
}: {
  percentageChange: number | null;
  isExpense: boolean;
}) {
  const { color, direction } = getComparisonIndicator(percentageChange, isExpense);
  const colorClass = COLOR_CLASSES[color];

  if (percentageChange === null) {
    return <span className="text-caption text-text-secondary">-</span>;
  }

  const formatted = `${Math.abs(percentageChange).toFixed(1)}%`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-caption font-medium ${colorClass}`}>
      {direction === 'up' && <ArrowUp className={colorClass} />}
      {direction === 'down' && <ArrowDown className={colorClass} />}
      {formatted}
    </span>
  );
}

export default function MonthOverMonthComparison({ metrics }: MonthOverMonthComparisonProps) {
  const formatIDR = useFormatIDR();
  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Perbandingan Bulan Sebelumnya</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-caption text-text-secondary">{metric.label}</p>
            <p className="text-body font-semibold text-text-primary">
              {formatIDR(metric.currentValue)}
            </p>
            <ChangeIndicator
              percentageChange={metric.percentageChange}
              isExpense={metric.isExpense}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
