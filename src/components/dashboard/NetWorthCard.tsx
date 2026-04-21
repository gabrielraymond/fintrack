'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface NetWorthCardProps {
  netWorth: number;
}

export default function NetWorthCard({ netWorth }: NetWorthCardProps) {
  const formatIDR = useFormatIDR();
  const isNegative = netWorth < 0;

  return (
    <Card>
      <p className="text-caption text-text-secondary mb-1">Kekayaan Bersih</p>
      <p
        className={`text-2xl font-bold ${isNegative ? 'text-danger' : 'text-text-primary'}`}
        aria-label={`Kekayaan bersih ${formatIDR(netWorth)}`}
      >
        {formatIDR(netWorth)}
      </p>
    </Card>
  );
}
