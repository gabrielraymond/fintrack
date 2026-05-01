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
    <Card className="!p-3">
      <p className="text-[11px] text-text-secondary">Kekayaan Bersih</p>
      <p
        className={`text-lg font-bold ${total < 0 ? 'text-danger' : 'text-text-primary'}`}
        aria-label={`Kekayaan bersih ${formatIDR(total)}`}
      >
        {formatIDR(total)}
      </p>
      <div className="flex gap-4 mt-1.5">
        <div className="min-w-0">
          <p className="text-[11px] text-text-secondary">Operasional</p>
          <p
            className={`text-caption font-semibold truncate ${operational < 0 ? 'text-danger' : 'text-text-primary'}`}
            aria-label={`Saldo operasional ${formatIDR(operational)}`}
          >
            {formatIDR(operational)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-text-secondary">Simpanan</p>
          <p
            className={`text-caption font-semibold truncate ${savings < 0 ? 'text-danger' : 'text-text-primary'}`}
            aria-label={`Simpanan dan investasi ${formatIDR(savings)}`}
          >
            {formatIDR(savings)}
          </p>
        </div>
      </div>
    </Card>
  );
}
