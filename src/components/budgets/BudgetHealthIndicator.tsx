'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export type HealthLevel = 'healthy' | 'warning' | 'unhealthy';

export interface BudgetHealthProps {
  totalBudget: number;
  /** Saldo uang tunai (bank + e-wallet + cash), tanpa CC */
  cashBalance: number;
  /** Hutang CC (negatif atau nol) */
  creditCardDebt: number;
  /** Total amount already spent across all budgets */
  totalSpent?: number;
  /** Compact mode for dashboard */
  compact?: boolean;
}

export function getHealthLevel(totalBudget: number, operationalBalance: number): HealthLevel {
  if (operationalBalance <= 0) return 'unhealthy';
  if (totalBudget === 0) return 'healthy';
  const ratio = totalBudget / operationalBalance;
  if (ratio <= 0.75) return 'healthy';
  if (ratio <= 1.0) return 'warning';
  return 'unhealthy';
}

const healthConfig: Record<HealthLevel, { label: string; emoji: string; color: string; stroke: string; bg: string; border: string }> = {
  healthy: {
    label: 'Sehat',
    emoji: '✅',
    color: 'text-success',
    stroke: '#22c55e',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  warning: {
    label: 'Warning',
    emoji: '⚠️',
    color: 'text-warning',
    stroke: '#eab308',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
  unhealthy: {
    label: 'Tidak Sehat',
    emoji: '🚨',
    color: 'text-danger',
    stroke: '#ef4444',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
  },
};

export default function BudgetHealthIndicator({ totalBudget, cashBalance, creditCardDebt, totalSpent, compact = false }: BudgetHealthProps) {
  const formatIDR = useFormatIDR();

  // Sisa anggaran = limit yang belum terpakai (masih perlu dikeluarkan)
  const sisaAnggaran = totalBudget - (totalSpent ?? 0);
  // Uang bebas = uang tunai - sisa anggaran (tanpa CC)
  const uangBebas = cashBalance - Math.max(sisaAnggaran, 0);
  // Apakah anggaran melebihi uang tunai? Berarti akan pakai CC = hutang
  const willUseCC = uangBebas < 0;
  const ccUsageAmount = willUseCC ? Math.abs(uangBebas) : 0;
  const hasExistingDebt = creditCardDebt < 0;

  // Health dihitung berdasarkan uang tunai saja, bukan termasuk CC
  const effectiveBudget = totalSpent !== undefined ? Math.max(sisaAnggaran, 0) : totalBudget;
  const health = cashBalance <= 0
    ? 'unhealthy' as HealthLevel
    : totalSpent !== undefined
      ? getHealthLevel(Math.max(sisaAnggaran, 0), cashBalance)
      : getHealthLevel(totalBudget, cashBalance);
  const config = healthConfig[health];

  const ratio = cashBalance > 0 ? effectiveBudget / cashBalance : 0;
  const percentage = Math.round(ratio * 100);

  // SVG circle constants
  const size = 80;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percentage, 100) / 100;
  const dashOffset = circumference * (1 - progress);

  if (compact) {
    return (
      <div className={`rounded-lg px-3 py-2 ${config.bg} border ${config.border} space-y-1.5`}>
        {/* Row 1: Health status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{config.emoji}</span>
            <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
          </div>
          <span className={`text-[11px] ${config.color}`}>{percentage}%</span>
        </div>
        {/* Row 2: Anggaran vs uang tunai */}
        <div className="flex justify-between text-[10px] text-text-secondary">
          <span>Anggaran: {formatIDR(totalBudget)}</span>
          <span>Tunai: {formatIDR(cashBalance)}</span>
        </div>
        {/* Row 3: Sisa anggaran & uang bebas */}
        {totalSpent !== undefined && (
          <div className="flex justify-between text-[10px]">
            <span className="text-text-muted">Sisa anggaran: <span className={sisaAnggaran < 0 ? 'text-danger font-medium' : 'text-text-primary font-medium'}>{formatIDR(sisaAnggaran)}</span></span>
            <span className="text-text-muted">Uang bebas: <span className={uangBebas < 0 ? 'text-danger font-medium' : 'text-success font-medium'}>{formatIDR(Math.max(uangBebas, 0))}</span></span>
          </div>
        )}
        {/* CC warning */}
        {(willUseCC || hasExistingDebt) && (
          <div className="text-[10px] text-danger bg-danger/5 rounded px-1.5 py-0.5">
            {hasExistingDebt && <span>💳 Hutang CC: {formatIDR(Math.abs(creditCardDebt))}</span>}
            {willUseCC && hasExistingDebt && <span> · </span>}
            {willUseCC && <span>⚠️ Anggaran melebihi tunai {formatIDR(ccUsageAmount)}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`!p-3 border ${config.border} ${config.bg}`}>
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="shrink-0 relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="currentColor"
              className="text-border/40" strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={config.stroke}
              strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-sm font-bold ${config.color}`}>{percentage}%</span>
          </div>
        </div>

        {/* Info beside circle */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{config.emoji}</span>
            <span className={`text-body font-semibold ${config.color}`}>{config.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-caption">
            <div>
              <p className="text-text-muted text-[10px]">Total Anggaran</p>
              <p className="text-text-primary font-medium">{formatIDR(totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-text-muted text-[10px]">Uang Tunai</p>
              <p className="text-text-primary font-medium">{formatIDR(cashBalance)}</p>
            </div>
            {totalSpent !== undefined && (
              <>
                <div>
                  <p className="text-text-muted text-[10px]">Sisa Anggaran</p>
                  <p className={`font-medium ${sisaAnggaran < 0 ? 'text-danger' : 'text-text-primary'}`}>{formatIDR(sisaAnggaran)}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-[10px]">Uang Bebas</p>
                  <p className={`font-medium ${uangBebas < 0 ? 'text-danger' : 'text-success'}`}>{formatIDR(Math.max(uangBebas, 0))}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CC awareness section */}
      {(willUseCC || hasExistingDebt) && (
        <div className="mt-2 rounded-lg bg-danger/5 border border-danger/20 px-3 py-2 space-y-1">
          {hasExistingDebt && (
            <div className="flex items-center justify-between text-caption">
              <span className="text-text-secondary">💳 Hutang CC saat ini</span>
              <span className="text-danger font-medium">{formatIDR(Math.abs(creditCardDebt))}</span>
            </div>
          )}
          {willUseCC && (
            <p className="text-[11px] text-danger">
              ⚠️ Sisa anggaran melebihi uang tunai sebesar {formatIDR(ccUsageAmount)}. Jika dilanjutkan, kamu akan menambah hutang CC.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
