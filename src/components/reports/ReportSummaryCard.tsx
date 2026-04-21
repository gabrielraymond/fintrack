'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface ReportSummaryCardProps {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export default function ReportSummaryCard({
  totalIncome,
  totalExpenses,
  netChange,
}: ReportSummaryCardProps) {
  const formatIDR = useFormatIDR();
  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Ringkasan Periode</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-caption text-text-secondary">Pemasukan</p>
          <p className="text-body font-semibold text-success">
            {formatIDR(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-secondary">Pengeluaran</p>
          <p className="text-body font-semibold text-danger">
            {formatIDR(totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-secondary">Selisih Bersih</p>
          <p
            className={`text-body font-semibold ${netChange >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatIDR(netChange)}
          </p>
        </div>
      </div>
    </Card>
  );
}
