'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { FinancialGoal, GoalCategory } from '@/types';

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  tabungan: '💰',
  dana_darurat: '🛡️',
  liburan: '✈️',
  pendidikan: '📚',
  pelunasan_hutang: '💳',
  lainnya: '🎯',
};

export interface GoalCardProps {
  goal: FinancialGoal;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (goal: FinancialGoal) => void;
  onCancel: (goal: FinancialGoal) => void;
  onClick?: (goal: FinancialGoal) => void;
}

function getRemainingDays(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GoalCard({ goal, onEdit, onDelete, onCancel, onClick }: GoalCardProps) {
  const formatIDR = useFormatIDR();

  const percentage = goal.target_amount > 0
    ? Math.round((goal.current_amount / goal.target_amount) * 100)
    : 0;
  const barWidth = Math.min(percentage, 100);
  const isCompleted = goal.status === 'completed';
  const isCancelled = goal.status === 'cancelled';

  const barColor = isCompleted ? 'bg-success' : 'bg-primary';
  const icon = CATEGORY_ICONS[goal.category] ?? '🎯';

  return (
    <Card className={isCancelled ? 'opacity-50' : ''}>
      <div
        className={onClick ? 'cursor-pointer' : ''}
        onClick={() => onClick?.(goal)}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(goal);
          }
        }}
      >
        {/* Header: icon + name + action buttons */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="text-xl shrink-0" aria-hidden="true">{icon}</span>
            <div className="min-w-0">
              <h3 className="text-subheading text-text-primary truncate">
                {isCompleted && <span aria-label="Tercapai">✅ </span>}
                {goal.name}
              </h3>
            </div>
          </div>
          <div className="flex gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isCancelled && !isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(goal)}
                aria-label={`Batalkan goal ${goal.name}`}
              >
                ❌
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              aria-label={`Edit goal ${goal.name}`}
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal)}
              aria-label={`Hapus goal ${goal.name}`}
            >
              🗑️
            </Button>
          </div>
        </div>

        {/* Amount display */}
        <p className="text-body text-text-secondary mt-2">
          {formatIDR(goal.current_amount)} / {formatIDR(goal.target_amount)}
        </p>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between text-caption text-text-secondary mb-1">
            <span>
              {percentage}%
              {isCompleted && ' — Tercapai! 🎉'}
            </span>
            {goal.target_date && (
              <span>
                {(() => {
                  const days = getRemainingDays(goal.target_date);
                  if (days < 0) return `${Math.abs(days)} hari terlewat`;
                  if (days === 0) return 'Hari ini';
                  return `${days} hari lagi`;
                })()}
              </span>
            )}
          </div>
          <div
            className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres goal ${goal.name} ${percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
