'use client';

import React, { useState } from 'react';
import { usePresets } from '@/hooks/usePresets';
import { formatIDR } from '@/lib/formatters';
import TransactionModal from '@/components/transactions/TransactionModal';
import type { TransactionPreset } from '@/types';

const typeEmoji: Record<string, string> = {
  income: '💰',
  expense: '💸',
  transfer: '🔄',
};

export default function TransactionPresetChips() {
  const { data: presets, isLoading } = usePresets();
  const [selectedPreset, setSelectedPreset] = useState<TransactionPreset | null>(null);

  if (isLoading || !presets || presets.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <h3 className="text-caption text-text-secondary mb-2">Preset Cepat</h3>
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="list"
          aria-label="Preset transaksi cepat"
        >
          {presets.map((preset) => (
            <button
              key={preset.id}
              role="listitem"
              onClick={() => setSelectedPreset(preset)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-surface hover:bg-surface-secondary transition-colors text-caption text-text-primary"
              aria-label={`Preset ${preset.name}: ${formatIDR(preset.amount)}`}
            >
              <span aria-hidden="true">{typeEmoji[preset.type] ?? '📋'}</span>
              <span className="whitespace-nowrap">{preset.name}</span>
              <span className="text-text-muted whitespace-nowrap">{formatIDR(preset.amount)}</span>
            </button>
          ))}
        </div>
      </div>

      <TransactionModal
        open={!!selectedPreset}
        onClose={() => setSelectedPreset(null)}
        preset={
          selectedPreset
            ? {
                type: selectedPreset.type,
                category_id: selectedPreset.category_id ?? undefined,
                account_id: selectedPreset.account_id,
                destination_account_id: selectedPreset.destination_account_id ?? undefined,
                amount: selectedPreset.amount,
              }
            : undefined
        }
      />
    </>
  );
}
