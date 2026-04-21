'use client';

import React from 'react';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface SavingsProgressBarProps {
  balance: number;
  targetAmount: number;
}

export default function SavingsProgressBar({
  balance,
  targetAmount,
}: SavingsProgressBarProps) {
  const formatIDR = useFormatIDR();

  const percentage = targetAmount > 0 ? Math.round((balance / targetAmount) * 100) : 0;
  const isAchieved = percentage >= 100;
  const remaining = Math.max(0, targetAmount - balance);
  const barWidth = Math.min(percentage, 100);

  const barColor = isAchieved ? 'bg-success' : 'bg-primary';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-caption text-text-secondary mb-1">
        <span>{percentage}%{isAchieved ? ' — Tercapai! 🎉' : ''}</span>
        <span>Target: {formatIDR(targetAmount)}</span>
      </div>
      <div
        className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progres tabungan ${percentage}%`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      {!isAchieved && (
        <p className="mt-1 text-small text-text-secondary">
          Sisa {formatIDR(remaining)} lagi
        </p>
      )}
    </div>
  );
}
