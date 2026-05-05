'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { useFormatIDR } from '@/hooks/useFormatIDR';

export interface NetWorthCardProps {
  total: number;
  operational: number;
  savings: number;
  cash: number;
  creditCardDebt: number;
  /** Prediksi sisa limit CC setelah cicilan dipotong */
  ccAfterBill?: number | null;
  /** Total cicilan bulanan */
  totalInstallment?: number;
}

export default function NetWorthCard({ total, operational, savings, cash, creditCardDebt, ccAfterBill, totalInstallment }: NetWorthCardProps) {
  const formatIDR = useFormatIDR();
  const hasCC = creditCardDebt !== 0;
  const showInstallmentInfo = (ccAfterBill != null && ccAfterBill !== 0) || (totalInstallment != null && totalInstallment > 0);

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
          {/* Breakdown: Tunai vs CC */}
          <div className="flex gap-2 mt-0.5">
            <span className="text-[10px] text-text-muted">Tunai: <span className="text-text-secondary">{formatIDR(cash)}</span></span>
            {hasCC && (
              <span className="text-[10px] text-text-muted">CC: <span className="text-danger">{formatIDR(creditCardDebt)}</span></span>
            )}
          </div>
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

      {/* CC after bill & total installment */}
      {showInstallmentInfo && (
        <div className="mt-2 pt-2 border-t border-border flex gap-3">
          {totalInstallment != null && totalInstallment > 0 && (
            <span className="text-[10px] text-text-muted">
              Cicilan/bln: <span className="text-text-secondary font-medium">{formatIDR(totalInstallment)}</span>
            </span>
          )}
          {ccAfterBill != null && (
            <span className="text-[10px] text-text-muted">
              CC stlh tagihan: <span className={`font-medium ${ccAfterBill < 0 ? 'text-danger' : 'text-text-secondary'}`}>{formatIDR(ccAfterBill)}</span>
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
