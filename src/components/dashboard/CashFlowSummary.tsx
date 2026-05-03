'use client';

import React from 'react';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface CashFlowSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export default function CashFlowSummary({
  totalIncome,
  totalExpenses,
  netChange,
}: CashFlowSummaryProps) {
  const formatIDR = useFormatIDR();

  return (
    <div
      className="grid grid-cols-3 gap-2 text-center mb-2"
      role="group"
      aria-label="Ringkasan arus kas"
    >
      <div>
        <p className="text-[11px] text-text-secondary">Pemasukan</p>
        <p className="text-caption font-semibold text-success">
          {formatIDR(totalIncome)}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-text-secondary">Pengeluaran</p>
        <p className="text-caption font-semibold text-danger">
          {formatIDR(totalExpenses)}
        </p>
      </div>
      <div>
        <p className="text-[11px] text-text-secondary">Selisih</p>
        <p
          className={`text-caption font-semibold ${netChange >= 0 ? 'text-success' : 'text-danger'}`}
        >
          {formatIDR(netChange)}
        </p>
      </div>
    </div>
  );
}
