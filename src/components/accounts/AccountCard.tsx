'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreditCardProgress from './CreditCardProgress';
import { formatIDR } from '@/lib/formatters';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account } from '@/types';

export interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const typeLabel =
    ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type;

  const isNegative = account.balance < 0;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-subheading text-text-primary truncate">{account.name}</h3>
          <p className="text-caption text-text-secondary">{typeLabel}</p>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(account)}
            aria-label={`Edit akun ${account.name}`}
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(account)}
            aria-label={`Hapus akun ${account.name}`}
          >
            🗑️
          </Button>
        </div>
      </div>

      <p
        className={`text-heading mt-2 ${isNegative ? 'text-danger' : 'text-text-primary'}`}
        aria-label={`Saldo ${formatIDR(account.balance)}`}
      >
        {formatIDR(account.balance)}
      </p>

      {account.type === 'credit_card' && account.credit_limit !== null && (
        <CreditCardProgress
          balance={account.balance}
          creditLimit={account.credit_limit}
          dueDate={account.due_date}
        />
      )}
    </Card>
  );
}
