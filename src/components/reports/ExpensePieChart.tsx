'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { CategoryExpense } from '@/lib/report-utils';

export interface ExpensePieChartProps {
  data: CategoryExpense[];
  totalExpenses: number;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  percentage: number;
}

function renderPercentageLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  percentage,
}: CustomLabelProps) {
  const pct = percentage ?? Math.round(percent * 100);
  if (pct < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${pct}%`}
    </text>
  );
}

interface TooltipPayloadEntry {
  payload: CategoryExpense;
}

export default function ExpensePieChart({ data, totalExpenses }: ExpensePieChartProps) {
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
        <p className="text-caption font-semibold text-text-primary">
          {entry.categoryIcon} {entry.categoryName}
        </p>
        <p className="text-caption text-text-secondary">{formatIDR(entry.amount)}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <p className="text-caption text-text-secondary mb-3">Distribusi Pengeluaran</p>
        <p className="text-body text-text-muted text-center py-8">
          Belum ada data pengeluaran
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Distribusi Pengeluaran</p>
      <div className="w-full h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(props: PieLabelRenderProps) => {
                const p = props as PieLabelRenderProps & { percentage?: number };
                return renderPercentageLabel({
                  cx: Number(p.cx),
                  cy: Number(p.cy),
                  midAngle: Number(p.midAngle),
                  innerRadius: Number(p.innerRadius),
                  outerRadius: Number(p.outerRadius),
                  percent: Number(p.percent),
                  percentage: p.percentage ?? Math.round(Number(p.percent) * 100),
                });
              }}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible data table for screen readers */}
      <table className="sr-only" role="table" aria-label="Distribusi pengeluaran per kategori">
        <caption>Distribusi pengeluaran per kategori</caption>
        <thead>
          <tr>
            <th scope="col">Kategori</th>
            <th scope="col">Jumlah</th>
            <th scope="col">Persentase</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.categoryId}>
              <td>{entry.categoryName}</td>
              <td>{formatIDR(entry.amount)}</td>
              <td>{entry.percentage}%</td>
            </tr>
          ))}
          <tr>
            <td>Total</td>
            <td>{formatIDR(totalExpenses)}</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
