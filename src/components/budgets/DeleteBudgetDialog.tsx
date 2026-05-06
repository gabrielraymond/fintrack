'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { BudgetWithSpending } from '@/types';

export interface DeleteBudgetDialogProps {
  open: boolean;
  budget: BudgetWithSpending | null;
  loading?: boolean;
  onDeleteThisMonth: () => void;
  onDeleteAndStopRecurring: () => void;
  onCancel: () => void;
}

export default function DeleteBudgetDialog({
  open,
  budget,
  loading,
  onDeleteThisMonth,
  onDeleteAndStopRecurring,
  onCancel,
}: DeleteBudgetDialogProps) {
  const categoryName = budget?.category?.name ?? 'kategori ini';
  const isRecurring = budget?.is_recurring ?? false;

  return (
    <Modal open={open} onClose={onCancel} title="Hapus Anggaran">
      {isRecurring ? (
        <>
          <p className="text-body text-text-secondary mb-5">
            Anggaran <span className="font-semibold text-text-primary">{categoryName}</span> diatur
            sebagai berulang 🔄. Pilih tindakan yang ingin dilakukan:
          </p>

          <div className="space-y-3 mb-5">
            {/* Option 1: delete this month only */}
            <button
              type="button"
              onClick={onDeleteThisMonth}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              <p className="text-body font-semibold text-text-primary mb-0.5">
                Hapus bulan ini saja
              </p>
              <p className="text-caption text-text-secondary">
                Anggaran bulan ini dihapus, tapi bulan depan akan tetap dibuat otomatis.
              </p>
            </button>

            {/* Option 2: delete and stop recurring */}
            <button
              type="button"
              onClick={onDeleteAndStopRecurring}
              disabled={loading}
              className="w-full text-left px-4 py-3 rounded-xl border border-danger/40 bg-danger/5 hover:bg-danger/10 transition-colors disabled:opacity-50"
            >
              <p className="text-body font-semibold text-danger mb-0.5">
                Hapus &amp; hentikan pengulangan
              </p>
              <p className="text-caption text-text-secondary">
                Anggaran bulan ini dihapus dan tidak akan dibuat ulang di bulan berikutnya.
              </p>
            </button>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Batal
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-body text-text-secondary mb-4">
            Apakah Anda yakin ingin menghapus anggaran untuk{' '}
            <span className="font-semibold text-text-primary">{categoryName}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Batal
            </Button>
            <Button variant="danger" onClick={onDeleteThisMonth} disabled={loading}>
              Hapus
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
