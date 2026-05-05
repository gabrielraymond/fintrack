'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import type { RecurringCommitment } from '@/types';

export interface RecurringCommitmentCardProps {
  commitment: RecurringCommitment;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (commitment: RecurringCommitment) => void;
  onDelete: (commitment: RecurringCommitment) => void;
}

export default function RecurringCommitmentCard({
  commitment,
  onToggleActive,
  onEdit,
  onDelete,
}: RecurringCommitmentCardProps) {
  const formatIDR = useFormatIDR();

  return (
    <Card className="!p-3">
      {/* Header: name + status badge + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-caption font-semibold text-text-primary truncate">
              {commitment.name}
            </h3>
            {/* Status badge */}
            {commitment.is_active ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                Aktif
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                Nonaktif
              </span>
            )}
          </div>
        </div>

        {/* Edit & Delete buttons */}
        <div className="flex gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(commitment)}
            aria-label={`Edit komitmen ${commitment.name}`}
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(commitment)}
            aria-label={`Hapus komitmen ${commitment.name}`}
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Amount + toggle row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-text-muted">Per Bulan</p>
          <p className="text-caption font-semibold text-text-primary">
            {formatIDR(commitment.monthly_amount)}
          </p>
        </div>

        {/* Toggle switch */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">
            {commitment.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={commitment.is_active}
            aria-label={`${commitment.is_active ? 'Nonaktifkan' : 'Aktifkan'} komitmen ${commitment.name}`}
            onClick={() => onToggleActive(commitment.id, !commitment.is_active)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              commitment.is_active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                commitment.is_active ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Note */}
      {commitment.note && (
        <p className="mt-2 text-[10px] text-text-muted italic">{commitment.note}</p>
      )}
    </Card>
  );
}
