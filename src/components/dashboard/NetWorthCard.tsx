'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface NetWorthCardProps {
  total: number;
  operational: number;
  savings: number;
}

export default function NetWorthCard({ total, operational, savings }: NetWorthCardProps) {
  const formatIDR = useFormatIDR();

  return (
    <Card>
      {/* Primary: Total Net Worth */}
      <p className="text-caption text-text-secondary mb-1">Kekayaan Bersih</p>
      <p
        className={`text-2xl font-bold ${total < 0 ? 'text-danger' : 'text-text-primary'}`}
        aria-label={`Kekayaan bersih ${formatIDR(total)}`}
      >
        {formatIDR(total)}
      </p>

      {/* Secondary: Operational & Savings side by side */}
      <div className="flex gap-4 mt-3">
        <div className="flex-1 min-w-0">
          <p className="text-caption text-text-secondary mb-0.5">Saldo Operasional</p>
          <p
            className={`text-body font-semibold truncate ${operational < 0 ? 'text-danger' : 'text-text-primary'}`}
            aria-label={`Saldo operasional ${formatIDR(operational)}`}
          >
            {formatIDR(operational)}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-caption text-text-secondary mb-0.5">Simpanan &amp; Investasi</p>
          <p
            className={`text-body font-semibold truncate ${savings < 0 ? 'text-danger' : 'text-text-primary'}`}
            aria-label={`Simpanan dan investasi ${formatIDR(savings)}`}
          >
            {formatIDR(savings)}
          </p>
        </div>
      </div>
    </Card>
  );
}
