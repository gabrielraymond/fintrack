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
  const pct = Math.min(percentage, 100);
  const isCompleted = goal.status === 'completed';
  const isCancelled = goal.status === 'cancelled';
  const icon = CATEGORY_ICONS[goal.category] ?? '🎯';
  const remaining = goal.target_amount - goal.current_amount;

  // Circle SVG
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const strokeColor = isCompleted ? '#22c55e' : isCancelled ? '#6b7280' : '#6366f1';
  const textColor = isCompleted ? 'text-success' : isCancelled ? 'text-text-muted' : 'text-primary';

  return (
    <Card className={`!p-3 ${isCancelled ? 'opacity-50' : ''}`}>
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
        {/* Row 1: Name + actions */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-caption font-semibold text-text-primary truncate">
            {icon} {isCompleted && '✅ '}{goal.name}
          </h3>
          <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {!isCancelled && !isCompleted && (
              <Button variant="ghost" size="sm" onClick={() => onCancel(goal)} aria-label={`Batalkan goal ${goal.name}`}>
                ❌
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(goal)} aria-label={`Edit goal ${goal.name}`}>
              ✏️
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(goal)} aria-label={`Hapus goal ${goal.name}`}>
              🗑️
            </Button>
          </div>
        </div>

        {/* Row 2: Circle + info */}
        <div className="flex items-center gap-2.5">
          {/* Circle progress */}
          <div className="shrink-0 relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="currentColor"
                className="text-border/40" strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={strokeColor}
                strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${textColor}`}>{percentage}%</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>{formatIDR(goal.current_amount)}</span>
              <span>/ {formatIDR(goal.target_amount)}</span>
            </div>
            <p className={`text-caption font-semibold ${remaining <= 0 ? 'text-success' : 'text-text-primary'}`}>
              {remaining <= 0 ? 'Tercapai! 🎉' : `Kurang: ${formatIDR(remaining)}`}
            </p>
            {goal.target_date && (
              <p className="text-[10px] text-text-muted">
                {(() => {
                  const days = getRemainingDays(goal.target_date);
                  if (days < 0) return `${Math.abs(days)} hari terlewat`;
                  if (days === 0) return 'Hari ini';
                  return `${days} hari lagi`;
                })()}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
