'use client';

import React from 'react';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { calculateInvestmentPL } from '@/lib/investmentPL';

interface InvestmentPLDisplayProps {
  balance: number;
  investedAmount: number;
}

export default function InvestmentPLDisplay({
  balance,
  investedAmount,
}: InvestmentPLDisplayProps) {
  const formatIDR = useFormatIDR();
  const result = calculateInvestmentPL(balance, investedAmount);

  if (!result) {
    return null;
  }

  const { profitLoss, percentage, isProfit } = result;
  const colorClass = isProfit ? 'text-success' : 'text-danger';
  const prefix = isProfit ? '+' : '';

  return (
    <div className="mt-3 p-3 bg-surface-secondary rounded-lg space-y-2">
      {/* Total Modal & Nilai Saat Ini */}
      <div className="grid grid-cols-2 gap-2 text-caption">
        <div>
          <p className="text-text-muted">Total Modal</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(investedAmount)}
          </p>
        </div>
        <div>
          <p className="text-text-muted">Nilai Saat Ini</p>
          <p className="text-text-secondary font-medium">
            {formatIDR(balance)}
          </p>
        </div>
      </div>

      {/* Profit/Loss */}
      <div className="pt-1 border-t border-border">
        <div className="flex justify-between items-center">
          <p className="text-caption text-text-muted">
            {isProfit ? 'Keuntungan' : 'Kerugian'}
          </p>
          <div className="text-right">
            <p className={`text-body font-semibold ${colorClass}`}>
              {prefix}{formatIDR(profitLoss)}
            </p>
            <p className={`text-caption ${colorClass}`}>
              ({prefix}{percentage.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
