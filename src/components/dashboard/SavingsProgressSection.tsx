'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import SavingsProgressBar from '@/components/accounts/SavingsProgressBar';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { Account } from '@/types';

export interface SavingsProgressSectionProps {
  accounts: Account[];
}

export default function SavingsProgressSection({ accounts }: SavingsProgressSectionProps) {
  const formatIDR = useFormatIDR();

  const savingsWithTargets = accounts.filter(
    (a) =>
      (a.type === 'tabungan' || a.type === 'dana_darurat') &&
      a.target_amount !== null &&
      a.target_amount > 0,
  );

  if (savingsWithTargets.length === 0) return null;

  return (
    <Card className="!p-3">
      <p className="text-[11px] text-text-secondary mb-2">Progres Tabungan</p>
      <div className="space-y-2">
        {savingsWithTargets.map((account) => (
          <div key={account.id}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[11px] text-text-primary font-medium">
                {account.name}
              </span>
              <span className="text-[11px] text-text-secondary">
                {formatIDR(account.balance)} / {formatIDR(account.target_amount!)}
              </span>
            </div>
            <SavingsProgressBar
              balance={account.balance}
              targetAmount={account.target_amount!}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
