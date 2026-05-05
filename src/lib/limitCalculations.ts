/**
 * limitCalculations.ts
 *
 * Pure functions for Installment & Commitment Tracker calculations.
 * All functions are side-effect free and depend only on their inputs.
 *
 * Requirements: 1.3, 1.4, 1a.1, 1a.2, 1b.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { Installment, RecurringCommitment, InstallmentPaymentLog } from '@/types';

/**
 * Determines whether a credit card installment has been deducted this month.
 * Angsuran_Sudah_Terpotong = today.getDate() >= dueDay
 *
 * Property 4: Status Angsuran_Sudah_Terpotong
 * Requirements: 1a.1
 */
export function isInstallmentDeducted(today: Date, dueDay: number): boolean {
  return today.getDate() >= dueDay;
}

/**
 * Calculates remaining tenor in months.
 * Sisa_Tenor = max(0, (endYear * 12 + endMonth) - (todayYear * 12 + todayMonth))
 *
 * Property 2: Kalkulasi Sisa Tenor dan Total Sisa Hutang
 * Requirements: 1.3
 */
export function calculateRemainingTenor(
  startDate: Date,
  tenorMonths: number,
  today: Date
): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth(); // 0-indexed

  // End month index (0-indexed) = startMonth + tenorMonths - 1
  const endTotalMonths = startYear * 12 + startMonth + tenorMonths - 1;
  const todayTotalMonths = today.getFullYear() * 12 + today.getMonth();

  return Math.max(0, endTotalMonths - todayTotalMonths);
}

/**
 * Calculates the current installment number (cicilan ke-berapa).
 * = tenor_months - remaining_tenor, clamped to [1, tenor_months]
 */
export function calculateCurrentInstallmentNumber(
  tenorMonths: number,
  remainingTenor: number
): number {
  return Math.min(tenorMonths, Math.max(1, tenorMonths - remainingTenor));
}

/**
 * Calculates total remaining debt for an installment.
 * total_sisa = monthly_amount * remaining_tenor
 *
 * Property 2: Kalkulasi Sisa Tenor dan Total Sisa Hutang
 * Requirements: 1.4
 */
export function calculateRemainingDebt(
  monthlyAmount: number,
  remainingTenor: number
): number {
  return monthlyAmount * remainingTenor;
}

/**
 * Calculates total monthly obligation for an account.
 * = sum(active installment monthly_amounts) + sum(active commitment monthly_amounts)
 *
 * Property 7: Total_Kewajiban_Bulanan adalah Jumlah Semua Kewajiban Aktif
 * Requirements: 3.1, 2.3
 */
export function calculateTotalMonthlyObligation(
  installments: Installment[],
  commitments: RecurringCommitment[]
): number {
  const installmentTotal = installments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.monthly_amount, 0);

  const commitmentTotal = commitments
    .filter((c) => c.is_active)
    .reduce((sum, c) => sum + c.monthly_amount, 0);

  return installmentTotal + commitmentTotal;
}

/**
 * Calculates Limit_Real_Sekarang for a credit_card account.
 * = credit_limit
 *   - sum(CC installments where Angsuran_Sudah_Terpotong = true)
 *   - sum(active commitments)
 *
 * Note: recurring_commitments don't have a due_day field, so all active
 * commitments are counted as already deducted for the current month.
 *
 * Property 9: Limit_Real_Sekarang Mencerminkan Kewajiban yang Sudah Terealisasi
 * Requirements: 3.2
 */
export function calculateCurrentEffectiveLimitCC(
  creditLimit: number,
  installments: Installment[],
  commitments: RecurringCommitment[],
  today: Date
): number {
  const deductedInstallments = installments
    .filter(
      (i) =>
        i.status === 'active' &&
        i.installment_type === 'cc' &&
        isInstallmentDeducted(today, i.due_day)
    )
    .reduce((sum, i) => sum + i.monthly_amount, 0);

  const deductedCommitments = commitments
    .filter((c) => c.is_active)
    .reduce((sum, c) => sum + c.monthly_amount, 0);

  return creditLimit - deductedInstallments - deductedCommitments;
}

/**
 * Calculates Limit_Real_Sekarang for a non-CC account.
 * = commitment_limit
 *   - sum(non-CC installments with status 'paid' this month)
 *   - sum(active commitments)
 *
 * Property 9: Limit_Real_Sekarang Mencerminkan Kewajiban yang Sudah Terealisasi
 * Requirements: 3.4
 */
export function calculateCurrentEffectiveLimitNonCC(
  commitmentLimit: number,
  installments: Installment[],
  commitments: RecurringCommitment[],
  paymentLogs: InstallmentPaymentLog[],
  today: Date
): number {
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const paidInstallmentIds = new Set(
    paymentLogs
      .filter((log) => log.payment_month === currentMonth && log.status === 'paid')
      .map((log) => log.installment_id)
  );

  const paidInstallmentsTotal = installments
    .filter(
      (i) =>
        i.status === 'active' &&
        i.installment_type === 'non_cc' &&
        paidInstallmentIds.has(i.id)
    )
    .reduce((sum, i) => sum + i.monthly_amount, 0);

  const activeCommitmentsTotal = commitments
    .filter((c) => c.is_active)
    .reduce((sum, c) => sum + c.monthly_amount, 0);

  return commitmentLimit - paidInstallmentsTotal - activeCommitmentsTotal;
}

/**
 * Calculates Prediksi_Limit_Tagihan (projected effective limit).
 * = limit - total_monthly_obligation
 *
 * Property 8: Prediksi_Limit_Tagihan = Limit - Total_Kewajiban_Bulanan
 * Requirements: 3.3, 3.5
 */
export function calculateProjectedEffectiveLimit(
  limit: number,
  totalMonthlyObligation: number
): number {
  return limit - totalMonthlyObligation;
}
