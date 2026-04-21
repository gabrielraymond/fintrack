'use client';

import React from 'react';
import { formatDate } from '@/lib/formatters';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { TransactionWithRelations } from '@/hooks/useInfiniteScroll';

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  onTransactionClick?: (transaction: TransactionWithRelations) => void;
  onEdit?: (transaction: TransactionWithRelations) => void;
  onDelete?: (transaction: TransactionWithRelations) => void;
}

function getTypeIcon(type: 'income' | 'expense' | 'transfer') {
  switch (type) {
    case 'income':
      return (
        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" />
        </svg>
      );
    case 'expense':
      return (
        <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 16l-4-4m4 4l4-4" />
        </svg>
      );
    case 'transfer':
      return (
        <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4-4m-4 4l4 4" />
        </svg>
      );
  }
}

function getAmountColorClass(type: 'income' | 'expense' | 'transfer') {
  switch (type) {
    case 'income':
      return 'text-success';
    case 'expense':
      return 'text-danger';
    case 'transfer':
      return 'text-secondary';
  }
}

function getAmountPrefix(type: 'income' | 'expense' | 'transfer') {
  switch (type) {
    case 'income':
      return '+ ';
    case 'expense':
      return '- ';
    case 'transfer':
      return '';
  }
}

function groupByDate(transactions: TransactionWithRelations[]) {
  const groups: { date: string; items: TransactionWithRelations[] }[] = [];
  let currentDate = '';

  for (const tx of transactions) {
    if (tx.date !== currentDate) {
      currentDate = tx.date;
      groups.push({ date: currentDate, items: [tx] });
    } else {
      groups[groups.length - 1].items.push(tx);
    }
  }

  return groups;
}

export default function TransactionList({
  transactions,
  onTransactionClick,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const formatIDR = useFormatIDR();
  const groups = groupByDate(transactions);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.date} aria-label={`Transaksi ${formatDate(group.date)}`}>
          <h2 className="text-caption text-text-muted font-semibold mb-2 sticky top-0 bg-background py-1 z-10">
            {formatDate(group.date)}
          </h2>
          <ul className="space-y-2">
            {group.items.map((tx) => (
              <li key={tx.id}>
                <div className="flex items-center gap-2 rounded-xl bg-surface border border-border hover:bg-surface-secondary transition-colors">
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-3 p-3 text-left min-w-0"
                    onClick={() => {
                      onTransactionClick?.(tx);
                      onEdit?.(tx);
                    }}
                    aria-label={`Edit ${tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer'} ${formatIDR(tx.amount)} ${tx.category?.name ?? tx.note ?? ''}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-text-primary truncate">
                        {tx.category?.name ?? (tx.type === 'transfer' ? 'Transfer' : '-')}
                      </p>
                      {tx.note && (
                        <p className="text-caption text-text-muted truncate">{tx.note}</p>
                      )}
                      <p className="text-small text-text-muted">{tx.account?.name ?? '-'}</p>
                    </div>
                    <span className={`text-body font-semibold ${getAmountColorClass(tx.type)} whitespace-nowrap`}>
                      {getAmountPrefix(tx.type)}{formatIDR(tx.amount)}
                    </span>
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      className="flex-shrink-0 p-2 mr-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      onClick={() => onDelete(tx)}
                      aria-label={`Hapus transaksi ${tx.category?.name ?? tx.type} ${formatIDR(tx.amount)}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
