'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import {
  isInstallmentDeducted,
  calculateRemainingTenor,
  calculateRemainingDebt,
  calculateCurrentInstallmentNumber,
} from '@/lib/limitCalculations';
import type { Installment, InstallmentPaymentLog } from '@/types';

export interface InstallmentCardProps {
  installment: Installment;
  paymentLog: InstallmentPaymentLog | null; // log bulan berjalan (untuk Non-CC)
  today: Date;
  onConfirmPayment?: (installmentId: string) => void;
  onEdit: (installment: Installment) => void;
  onDelete: (installment: Installment) => void;
}

export default function InstallmentCard({
  installment,
  paymentLog,
  today,
  onConfirmPayment,
  onEdit,
  onDelete,
}: InstallmentCardProps) {
  const formatIDR = useFormatIDR();

  const isCC = installment.installment_type === 'cc';
  const startDate = new Date(installment.start_date);
  const remainingTenor = calculateRemainingTenor(startDate, installment.tenor_months, today);
  const remainingDebt = calculateRemainingDebt(installment.monthly_amount, remainingTenor);
  const currentInstallmentNumber = calculateCurrentInstallmentNumber(
    installment.tenor_months,
    remainingTenor
  );

  // CC status
  const deducted = isCC ? isInstallmentDeducted(today, installment.due_day) : false;

  // Non-CC status
  const isPaid = !isCC && paymentLog?.status === 'paid';
  const isUnpaid = !isCC && !isPaid;

  return (
    <Card className="!p-3">
      {/* Header: name + type badge + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-caption font-semibold text-text-primary truncate">
              {installment.name}
            </h3>
            {/* Type badge */}
            {isCC ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                CC
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                Non-CC
              </span>
            )}
          </div>
        </div>

        {/* Edit & Delete buttons */}
        <div className="flex gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(installment)}
            aria-label={`Edit cicilan ${installment.name}`}
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(installment)}
            aria-label={`Hapus cicilan ${installment.name}`}
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <div>
          <p className="text-[10px] text-text-muted">Angsuran Bulanan</p>
          <p className="text-caption font-semibold text-text-primary">
            {formatIDR(installment.monthly_amount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Jatuh Tempo</p>
          <p className="text-caption text-text-primary">
            Tgl {installment.due_day}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Progress Cicilan</p>
          <p className="text-caption text-text-primary">
            Ke-{currentInstallmentNumber} dari {installment.tenor_months}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Sisa Tenor</p>
          <p className="text-caption text-text-primary">
            {remainingTenor} bulan lagi
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-text-muted">Total Sisa Hutang</p>
          <p className="text-caption font-semibold text-text-primary">
            {formatIDR(remainingDebt)}
          </p>
        </div>
      </div>

      {/* Status badge + action */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {isCC ? (
          /* Cicilan_CC: auto status badge */
          deducted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✅ Sudah terpotong
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
              ⏳ Belum jatuh tempo
            </span>
          )
        ) : (
          /* Cicilan_Non_CC: manual payment status */
          <div className="flex items-center gap-2 flex-wrap">
            {isPaid ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                ✅ Sudah dibayar
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  ❌ Belum dibayar
                </span>
                {isUnpaid && onConfirmPayment && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onConfirmPayment(installment.id)}
                    aria-label={`Konfirmasi pembayaran cicilan ${installment.name}`}
                  >
                    Konfirmasi Bayar
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      {installment.note && (
        <p className="mt-2 text-[10px] text-text-muted italic">{installment.note}</p>
      )}
    </Card>
  );
}
