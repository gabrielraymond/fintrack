'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { CategoryExpense } from '@/lib/report-utils';

export interface CategoryBreakdownProps {
  data: CategoryExpense[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const formatIDR = useFormatIDR();

  if (data.length === 0) {
    return (
      <Card>
        <p className="text-caption text-text-secondary mb-3">Rincian Pengeluaran</p>
        <p className="text-body text-text-muted text-center py-8">
          Belum ada data pengeluaran
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Rincian Pengeluaran</p>
      <ul className="space-y-3">
        {data.map((entry) => (
          <li key={entry.categoryId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">{entry.categoryIcon}</span>
                <span className="text-body text-text-primary truncate">
                  {entry.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-body text-text-primary font-medium">
                  {formatIDR(entry.amount)}
                </span>
                <span className="text-caption text-text-secondary w-10 text-right">
                  {entry.percentage}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${entry.percentage}%`,
                  backgroundColor: entry.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
