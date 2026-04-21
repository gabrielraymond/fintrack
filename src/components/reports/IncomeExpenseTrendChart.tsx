'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { formatIDRShort } from '@/lib/report-utils';
import type { MonthlyTrendData } from '@/lib/report-utils';

export interface IncomeExpenseTrendChartProps {
  data: MonthlyTrendData[];
}

interface TooltipPayloadEntry {
  value: number;
  dataKey: string;
  payload: MonthlyTrendData;
}

export default function IncomeExpenseTrendChart({ data }: IncomeExpenseTrendChartProps) {
  const formatIDR = useFormatIDR();

  function CustomTooltipContent({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
  }) {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0].payload;
    return (
      <div className="rounded-lg bg-surface border border-border shadow-md px-3 py-2">
        <p className="text-caption font-semibold text-text-primary mb-1">
          {entry.monthFull}
        </p>
        <p className="text-caption text-green-600">
          Pemasukan: {formatIDR(entry.income)}
        </p>
        <p className="text-caption text-red-500">
          Pengeluaran: {formatIDR(entry.expense)}
        </p>
      </div>
    );
  }

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Tren Pemasukan &amp; Pengeluaran</p>
      <div className="w-full h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value: number) => formatIDRShort(value)} tick={{ fontSize: 11 }} width={50} />
            <Tooltip content={<CustomTooltipContent />} />
            <Legend
              formatter={(value: string) =>
                value === 'income' ? 'Pemasukan' : 'Pengeluaran'
              }
            />
            <Bar dataKey="income" name="income" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
