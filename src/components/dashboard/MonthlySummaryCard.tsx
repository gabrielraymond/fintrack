'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { formatIDR } from '@/lib/formatters';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
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
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  return useQuery({
    queryKey: ['transactions', 'monthly', user?.id, monthStart],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', monthStart)
        .lt('date', monthEnd)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data as Transaction[]) ?? [];
    },
    enabled: !!user,
  });
}

export { useCurrentMonthTransactions };

export default function MonthlySummaryCard() {
  const { data: transactions, isLoading } = useCurrentMonthTransactions();
  const summary = calculateMonthlySummary(transactions ?? []);

  if (isLoading) return null;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Ringkasan Bulan Ini</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-caption text-text-secondary">Pemasukan</p>
          <p className="text-body font-semibold text-success">
            {formatIDR(summary.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-secondary">Pengeluaran</p>
          <p className="text-body font-semibold text-danger">
            {formatIDR(summary.totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-secondary">Selisih</p>
          <p
            className={`text-body font-semibold ${summary.netChange >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatIDR(summary.netChange)}
          </p>
        </div>
      </div>
    </Card>
  );
}
