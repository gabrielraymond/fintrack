'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useGoalDetail, useGoalContributions } from '@/hooks/useGoals';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { FinancialGoal, GoalContribution, GoalContributionWithAccount, GoalCategory } from '@/types';

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  tabungan: '💰',
  dana_darurat: '🛡️',
  liburan: '✈️',
  pendidikan: '📚',
  pelunasan_hutang: '💳',
  lainnya: '🎯',
};

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  tabungan: 'Tabungan',
  dana_darurat: 'Dana Darurat',
  liburan: 'Liburan',
  pendidikan: 'Pendidikan',
  pelunasan_hutang: 'Pelunasan Hutang',
  lainnya: 'Lainnya',
};

export interface GoalDetailViewProps {
  goalId: string;
  onAddContribution: () => void;
  onWithdrawContribution: () => void;
  onCancel: () => void;
  onClose: () => void;
}

/**
 * Calculate estimated achievement date based on average monthly contributions.
 * Requires at least 2 positive contributions. Returns null if estimation is not possible.
 */
export function calculateEstimatedDate(
  goal: FinancialGoal,
  contributions: GoalContribution[],
): Date | null {
  const positiveContributions = contributions.filter((c) => c.amount > 0);
  if (positiveContributions.length < 2) return null;

  // Contributions are sorted newest first, so last element is the earliest
  const firstDate = new Date(positiveContributions[positiveContributions.length - 1].created_at);
  const lastDate = new Date(positiveContributions[0].created_at);
  const monthsDiff = Math.max(
    1,
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (lastDate.getMonth() - firstDate.getMonth()),
  );

  const totalPositive = positiveContributions.reduce((sum, c) => sum + c.amount, 0);
  const avgMonthly = totalPositive / monthsDiff;

  if (avgMonthly <= 0) return null;

  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;

  const monthsNeeded = Math.ceil(remaining / avgMonthly);
  const estimated = new Date();
  estimated.setMonth(estimated.getMonth() + monthsNeeded);
  return estimated;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function GoalDetailView({
  goalId,
  onAddContribution,
  onWithdrawContribution,
  onCancel,
  onClose,
}: GoalDetailViewProps) {
  const { data: goal, isLoading: goalLoading } = useGoalDetail(goalId);
  const { data: contributions = [], isLoading: contribLoading } = useGoalContributions(goalId);
  const formatIDR = useFormatIDR();

  if (goalLoading || contribLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-secondary rounded w-1/2" />
          <div className="h-4 bg-surface-secondary rounded w-3/4" />
          <div className="h-3 bg-surface-secondary rounded-full" />
        </div>
      </Card>
    );
  }

  if (!goal) {
    return (
      <Card>
        <p className="text-body text-text-secondary">Goal tidak ditemukan.</p>
      </Card>
    );
  }

  const icon = CATEGORY_ICONS[goal.category] ?? '🎯';
  const categoryLabel = CATEGORY_LABELS[goal.category] ?? goal.category;
  const percentage = goal.target_amount > 0
    ? Math.round((goal.current_amount / goal.target_amount) * 100)
    : 0;
  const barWidth = Math.min(percentage, 100);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.status === 'completed';
  const isCancelled = goal.status === 'cancelled';
  const isActive = goal.status === 'active';

  // Estimation
  const positiveContributions = contributions.filter((c) => c.amount > 0);
  const estimatedDate = calculateEstimatedDate(goal, contributions);
  const hasEnoughContributions = positiveContributions.length >= 2;

  // Warning: estimation exceeds target_date
  let estimationWarning = false;
  if (estimatedDate && goal.target_date) {
    const targetDate = new Date(goal.target_date);
    estimationWarning = estimatedDate > targetDate;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">{icon}</span>
            <div>
              <h2 className="text-heading text-text-primary">
                {isCompleted && <span aria-label="Tercapai">✅ </span>}
                {goal.name}
              </h2>
              <p className="text-caption text-text-secondary">{categoryLabel}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup detail">
            ✕
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-body text-text-secondary mb-1">
            <span>{formatIDR(goal.current_amount)} / {formatIDR(goal.target_amount)}</span>
            <span>{percentage}%</span>
          </div>
          <div
            className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres goal ${goal.name} ${percentage}%`}
          >
            <div
              className={`h-full rounded-full transition-all ${isCompleted ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Remaining amount */}
        <div className="flex justify-between text-caption text-text-secondary mb-3">
          <span>Sisa: {formatIDR(remaining)}</span>
          {goal.target_date && (
            <span>Target: {formatDate(goal.target_date)}</span>
          )}
        </div>

        {goal.note && (
          <p className="text-caption text-text-secondary mb-3">📝 {goal.note}</p>
        )}

        {isCancelled && (
          <p className="text-caption text-danger mb-3">Goal ini telah dibatalkan.</p>
        )}

        {/* Action buttons */}
        {isActive && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={onAddContribution}>
              Tambah Kontribusi
            </Button>
            <Button variant="secondary" size="sm" onClick={onWithdrawContribution}>
              Tarik Dana
            </Button>
            <Button variant="danger" size="sm" onClick={onCancel}>
              Batalkan Goal
            </Button>
          </div>
        )}
      </Card>

      {/* Estimation */}
      <Card title="Estimasi Pencapaian">
        {isCompleted ? (
          <p className="text-body text-success">Goal telah tercapai! 🎉</p>
        ) : !hasEnoughContributions || !estimatedDate ? (
          <p className="text-body text-text-secondary">
            Estimasi tidak tersedia — tambahkan kontribusi untuk melihat proyeksi
          </p>
        ) : (
          <div>
            <p className="text-body text-text-primary">
              Estimasi tercapai: {formatDate(estimatedDate.toISOString())}
            </p>
            {estimationWarning && (
              <p className="text-caption text-warning mt-1">
                ⚠️ Estimasi melampaui tanggal target. Pertimbangkan untuk menambah kontribusi.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Contribution history */}
      <Card title="Riwayat Kontribusi">
        {contributions.length === 0 ? (
          <p className="text-body text-text-secondary">Belum ada kontribusi.</p>
        ) : (
          <ul className="space-y-3" role="list">
            {contributions.map((c) => {
              const contrib = c as GoalContributionWithAccount;
              return (
                <li key={c.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className={`text-body font-medium ${c.amount > 0 ? 'text-success' : 'text-danger'}`}>
                      {c.amount > 0 ? '+' : ''}{formatIDR(Math.abs(c.amount))}
                    </p>
                    {contrib.account && (
                      <p className="text-caption text-text-secondary">
                        {contrib.account.name}
                        {contrib.account.is_deleted && ' (tidak aktif)'}
                      </p>
                    )}
                    {c.note && (
                      <p className="text-caption text-text-secondary">{c.note}</p>
                    )}
                  </div>
                  <span className="text-caption text-text-secondary shrink-0 ml-2">
                    {formatDate(c.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
