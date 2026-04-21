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
    <Card>
      <p className="text-caption text-text-secondary mb-3">Progres Tabungan</p>
      <div className="space-y-4">
        {savingsWithTargets.map((account) => (
          <div key={account.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-caption text-text-primary font-medium">
                {account.name}
              </span>
              <span className="text-caption text-text-secondary">
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
