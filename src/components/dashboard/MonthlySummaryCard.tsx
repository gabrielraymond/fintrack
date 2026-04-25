'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useCutoffDate } from '@/hooks/useCutoffDate';
import { getCycleRange } from '@/lib/cycle-utils';
import type { Transaction } from '@/types';

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export function calculateMonthlySummary(transactions: Transaction[]): MonthlySummary {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') totalIncome += tx.amount;
    else if (tx.type === 'expense') totalExpenses += tx.amount;
    // transfers excluded per Req 4.8
  }

  return {
    totalIncome,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
  };
}

function useCurrentMonthTransactions() {
  const { user } = useAuth();
  const { cutoffDate } = useCutoffDate();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(cutoffDate);

  return useQuery({
    queryKey: ['transactions', 'monthly', user?.id, cycleStart, cycleEnd],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', cycleStart)
        .lt('date', cycleEnd)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data as Transaction[]) ?? [];
    },
    enabled: !!user && !isNaN(cutoffDate),
  });
}

export { useCurrentMonthTransactions };

/**
 * Formats a "YYYY-MM-DD" date string to a short Indonesian label like "25 Jun".
 */
function formatShortDate(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

export default function MonthlySummaryCard() {
  const formatIDR = useFormatIDR();
  const { cutoffDate } = useCutoffDate();
  const { start: cycleStart, end: cycleEnd } = getCycleRange(cutoffDate);
  const { data: transactions, isLoading } = useCurrentMonthTransactions();
  const summary = calculateMonthlySummary(transactions ?? []);

  if (isLoading) return null;

  // Calculate the display end date (cycle end is exclusive, so subtract 1 day)
  const endDate = new Date(cycleEnd);
  endDate.setDate(endDate.getDate() - 1);
  const displayEnd = endDate.toISOString().split('T')[0];

  const periodLabel = cutoffDate === 1
    ? 'Ringkasan Bulan Ini'
    : `Ringkasan ${formatShortDate(cycleStart)} – ${formatShortDate(displayEnd)}`;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">{periodLabel}</p>
      <div className="grid grid-cols-3 gap-2 text-center overflow-hidden">
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">Pemasukan</p>
          <p className="text-body font-semibold text-success truncate">
            {formatIDR(summary.totalIncome)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">Pengeluaran</p>
          <p className="text-body font-semibold text-danger truncate">
            {formatIDR(summary.totalExpenses)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">Selisih</p>
          <p
            className={`text-body font-semibold truncate ${summary.netChange >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatIDR(summary.netChange)}
          </p>
        </div>
      </div>
    </Card>
  );
}
