'use client';

import React, { useMemo } from 'react';
import Card from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { Transaction } from '@/types';

export interface CashFlowChartProps {
  transactions: Transaction[];
}

interface DailyData {
  day: string;
  Pemasukan: number;
  Pengeluaran: number;
}

function buildDailyData(transactions: Transaction[]): DailyData[] {
  const byDay: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    if (tx.type === 'transfer') continue;
    const day = tx.date.slice(8, 10); // DD from YYYY-MM-DD
    if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
    if (tx.type === 'income') byDay[day].income += tx.amount;
    else if (tx.type === 'expense') byDay[day].expense += tx.amount;
  }

  return Object.keys(byDay)
    .sort()
    .map((day) => ({
      day,
      Pemasukan: byDay[day].income,
      Pengeluaran: byDay[day].expense,
    }));
}

export default function CashFlowChart({ transactions }: CashFlowChartProps) {
  const formatIDR = useFormatIDR();
  const data = useMemo(() => buildDailyData(transactions), [transactions]);

  if (data.length === 0) {
    return (
      <Card>
        <p className="text-caption text-text-secondary mb-2">Arus Kas</p>
        <p className="text-body text-text-muted text-center py-4">
          Belum ada data bulan ini
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-2">Arus Kas</p>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                return String(v);
              }}
              width={40}
            />
            <Tooltip
              formatter={(value) => formatIDR(Number(value))}
              labelFormatter={(label) => `Tanggal ${label}`}
            />
            <Legend />
            <Bar dataKey="Pemasukan" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
