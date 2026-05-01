# Implementation Plan: Investment Profit/Loss Tracking

## Overview

Implementasi pelacakan profit/loss untuk akun investasi. Dimulai dari database migration, lalu pure function P/L calculation, kemudian UI components (form, card, summary strip). Mengikuti pola yang sudah ada pada gold accounts.

## Tasks

- [x] 1. Database migration dan type updates
  - [x] 1.1 Buat migration file `supabase/migrations/00011_investment_amount.sql`
    - Tambahkan kolom `invested_amount BIGINT` (nullable) ke tabel accounts
    - Tidak perlu constraint khusus (field optional)
    - _Requirements: 1.1, 6.3_
  - [x] 1.2 Update interface `Account` di `src/types/index.ts`
    - Tambahkan `invested_amount: number | null`
    - _Requirements: 6.1_
  - [x] 1.3 Update interface `AccountFormInput` di `src/types/index.ts`
    - Tambahkan `invested_amount?: number`
    - _Requirements: 6.2_

- [x] 2. Implementasi pure function calculateInvestmentPL
  - [x] 2.1 Buat file `src/lib/investmentPL.ts`
    - Export interface `InvestmentPLResult` dengan fields: profitLoss, percentage, isProfit
    - Export function `calculateInvestmentPL(balance: number, investedAmount: number | null): InvestmentPLResult | null`
    - Return null jika investedAmount null atau <= 0
    - Hitung profitLoss = balance - investedAmount
    - Hitung percentage = (profitLoss / investedAmount) * 100
    - Set isProfit = profitLoss >= 0
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x]* 2.2 Write property tests for calculateInvestmentPL
    - Buat file `src/lib/__tests__/investmentPL.test.ts`
    - **Property 1: P/L Calculation Correctness**
    - **Validates: Requirements 2.1, 2.2**
    - **Property 2: Null Result for Invalid Inputs**
    - **Validates: Requirements 2.3**
    - **Property 3: isProfit Flag Correctness**
    - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update AccountForm untuk field invested_amount
  - [x] 4.1 Tambahkan state dan logic untuk invested_amount di `src/components/accounts/AccountForm.tsx`
    - Tambahkan state `investedAmount`
    - Tampilkan field "Modal Investasi (IDR)" ketika `type === 'investment'`
    - Set min=0 pada input, tolak nilai negatif
    - Include invested_amount di data onSubmit
    - Populate field dari account data saat edit mode
    - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.4_
  - [x]* 4.2 Write unit tests for AccountForm invested_amount field
    - Buat/update test file untuk AccountForm
    - Test field visibility: muncul untuk investment, hidden untuk tipe lain
    - Test form submission includes invested_amount
    - Test negative value handling
    - **Property 4: Negative Invested Amount Rejection**
    - **Validates: Requirements 5.4**
    - **Property 5: Form Field Visibility by Account Type**
    - **Validates: Requirements 1.2, 1.3**

- [x] 5. Buat komponen InvestmentPLDisplay
  - [x] 5.1 Buat file `src/components/accounts/InvestmentPLDisplay.tsx`
    - Props: balance, investedAmount
    - Gunakan calculateInvestmentPL untuk hitung P/L
    - Tampilkan: Total Modal, Nilai Saat Ini, Profit/Loss (IDR + percentage)
    - Warna hijau (text-success) untuk profit, merah (text-danger) untuk loss
    - Prefix "+" untuk profit, tanpa prefix untuk loss
    - Ikuti styling pattern dari GoldPriceDisplay
    - _Requirements: 2.4, 2.5, 2.6, 3.1, 3.2_
  - [x]* 5.2 Write unit tests for InvestmentPLDisplay
    - Test renders profit case dengan warna hijau dan prefix "+"
    - Test renders loss case dengan warna merah
    - Test renders break-even case

- [x] 6. Update AccountCard untuk investment P/L
  - [x] 6.1 Tambahkan InvestmentPLDisplay di `src/components/accounts/AccountCard.tsx`
    - Render InvestmentPLDisplay ketika account.type === 'investment' dan invested_amount valid (not null, > 0)
    - Tidak render jika invested_amount null atau 0
    - _Requirements: 3.1, 3.2, 3.3_
  - [x]* 6.2 Write unit tests for AccountCard investment rendering
    - Test shows InvestmentPLDisplay for investment account with valid invested_amount
    - Test hides InvestmentPLDisplay for investment account without invested_amount
    - Test no InvestmentPLDisplay for non-investment accounts

- [x] 7. Update AccountSummaryStrip untuk investment P/L
  - [x] 7.1 Tambahkan rendering P/L di `src/components/dashboard/AccountSummaryStrip.tsx`
    - Untuk akun investment dengan invested_amount valid: tampilkan balance + P/L di bawahnya (mirip gold)
    - Untuk akun investment tanpa invested_amount: tampilkan balance saja (existing behavior)
    - Gunakan calculateInvestmentPL untuk hitung P/L
    - Warna hijau/merah sesuai isProfit
    - _Requirements: 4.1, 4.2_
  - [x]* 7.2 Write unit tests for AccountSummaryStrip investment rendering
    - Test shows P/L for investment account with valid invested_amount
    - Test shows only balance for investment account without invested_amount

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests menggunakan fast-check yang sudah ada di project
- Pola implementasi mengikuti gold accounts (GoldPriceDisplay, gold fields di AccountForm)
- Semua P/L calculation di-centralize di `calculateInvestmentPL` untuk consistency
