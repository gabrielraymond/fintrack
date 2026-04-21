'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/formatters';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Transaction } from '@/types';

const typeLabel: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  transfer: 'Transfer',
};

const typeColor: Record<string, string> = {
  income: 'text-success',
  expense: 'text-danger',
  transfer: 'text-text-secondary',
};

function useRecentTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', 'recent', user?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data as Transaction[]) ?? [];
    },
    enabled: !!user,
  });
}

export default function RecentTransactions() {
  const formatIDR = useFormatIDR();
  const { data: transactions, isLoading } = useRecentTransactions();

  if (isLoading) return null;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-3">Transaksi Terakhir</p>
      {(!transactions || transactions.length === 0) ? (
        <p className="text-body text-text-muted text-center py-4">
          Belum ada transaksi
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-body text-text-primary truncate">
                  {tx.note || typeLabel[tx.type]}
                </p>
                <p className="text-small text-text-muted">
                  {formatDate(tx.date)}
                </p>
              </div>
              <p className={`text-body font-semibold ml-2 ${typeColor[tx.type]}`}>
                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                {formatIDR(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
