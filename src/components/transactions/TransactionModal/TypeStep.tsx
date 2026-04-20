'use client';

import React from 'react';
import type { TransactionType } from '@/types';

interface TypeStepProps {
  onSelect: (type: TransactionType) => void;
}

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: string; description: string }[] = [
  { value: 'income', label: 'Pemasukan', icon: '💰', description: 'Tambah pemasukan' },
  { value: 'expense', label: 'Pengeluaran', icon: '💸', description: 'Catat pengeluaran' },
  { value: 'transfer', label: 'Transfer', icon: '🔄', description: 'Pindah antar akun' },
];

export default function TypeStep({ onSelect }: TypeStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-body text-text-secondary mb-4">Pilih jenis transaksi</p>
      <div className="grid grid-cols-1 gap-3">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={option.label}
          >
            <span className="text-2xl" aria-hidden="true">{option.icon}</span>
            <div className="text-left">
              <span className="block text-body font-medium text-text-primary">{option.label}</span>
              <span className="block text-caption text-text-muted">{option.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
