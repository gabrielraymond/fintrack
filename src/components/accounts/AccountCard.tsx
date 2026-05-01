'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreditCardProgress from './CreditCardProgress';
import SavingsProgressBar from './SavingsProgressBar';
import GoldPriceDisplay from './GoldPriceDisplay';
import InvestmentPLDisplay from './InvestmentPLDisplay';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { ACCOUNT_TYPES } from '@/lib/constants';
import type { Account } from '@/types';

export interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const formatIDR = useFormatIDR();
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

      {/* Balance — hide for gold accounts (value shown in GoldPriceDisplay) */}
      {account.type !== 'gold' && (
        <p
          className={`text-heading mt-2 ${isNegative ? 'text-danger' : 'text-text-primary'}`}
          aria-label={`Saldo ${formatIDR(account.balance)}`}
        >
          {formatIDR(account.balance)}
        </p>
      )}

      {account.type === 'credit_card' && account.credit_limit !== null && (
        <CreditCardProgress
          balance={account.balance}
          creditLimit={account.credit_limit}
          dueDate={account.due_date}
        />
      )}

      {(account.type === 'tabungan' || account.type === 'dana_darurat') &&
        account.target_amount !== null && (
          <SavingsProgressBar
            balance={account.balance}
            targetAmount={account.target_amount}
          />
        )}

      {account.type === 'gold' &&
        account.gold_brand !== null &&
        account.gold_weight_grams !== null &&
        account.gold_purchase_price_per_gram !== null && (
          <GoldPriceDisplay
            brand={account.gold_brand}
            weightGrams={account.gold_weight_grams}
            purchasePricePerGram={account.gold_purchase_price_per_gram}
          />
        )}

      {account.type === 'investment' &&
        account.invested_amount !== null &&
        account.invested_amount > 0 && (
          <InvestmentPLDisplay
            balance={account.balance}
            investedAmount={account.invested_amount}
          />
        )}
    </Card>
  );
}
