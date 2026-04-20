'use client';

import React from 'react';
import { formatIDR } from '@/lib/formatters';
import type { Account } from '@/types';

const typeEmoji: Record<string, string> = {
  bank: '🏦',
  'e-wallet': '📱',
  cash: '💵',
  credit_card: '💳',
  investment: '📈',
};

export interface AccountSummaryStripProps {
  accounts: Account[];
}

export default function AccountSummaryStrip({ accounts }: AccountSummaryStripProps) {
  if (accounts.length === 0) return null;

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
      role="list"
      aria-label="Ringkasan akun"
    >
      {accounts.map((account) => (
        <div
          key={account.id}
          role="listitem"
          className="flex-shrink-0 min-w-[140px] rounded-lg border border-border bg-surface p-3"
        >
          <div className="flex items-center gap-1 mb-1">
            <span aria-hidden="true">{typeEmoji[account.type] ?? '📋'}</span>
            <span className="text-caption text-text-secondary truncate">
              {account.name}
            </span>
          </div>
          <p
            className={`text-body font-semibold ${account.balance < 0 ? 'text-danger' : 'text-text-primary'}`}
          >
            {formatIDR(account.balance)}
          </p>
        </div>
      ))}
    </div>
  );
}
