'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import IncomeExpenseTrendChart from '@/components/reports/IncomeExpenseTrendChart';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { YearlySummaryData } from '@/lib/report-utils';

export interface YearlySummaryViewProps {
  data: YearlySummaryData;
}

export default function YearlySummaryView({ data }: YearlySummaryViewProps) {
  const formatIDR = useFormatIDR();
  const {
    year,
    totalIncome,
    totalExpenses,
    netChange,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    monthlyData,
  } = data;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-caption text-text-secondary mb-3">
          Ringkasan Tahun {year}
        </p>

        {/* Annual totals */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-caption text-text-secondary">Total Pemasukan</p>
            <p className="text-body font-semibold text-success">
              {formatIDR(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">Total Pengeluaran</p>
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

        {/* Monthly averages */}
        <div className="grid grid-cols-2 gap-2 text-center border-t border-border pt-3">
          <div>
            <p className="text-caption text-text-secondary">Rata-rata Pemasukan/Bulan</p>
            <p className="text-body font-semibold text-text-primary">
              {formatIDR(Math.round(avgMonthlyIncome))}
            </p>
          </div>
          <div>
            <p className="text-caption text-text-secondary">Rata-rata Pengeluaran/Bulan</p>
            <p className="text-body font-semibold text-text-primary">
              {formatIDR(Math.round(avgMonthlyExpenses))}
            </p>
          </div>
        </div>
      </Card>

      {/* 12-month bar chart */}
      <IncomeExpenseTrendChart data={monthlyData} />
    </div>
  );
}
