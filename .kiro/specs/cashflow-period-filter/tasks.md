# Implementation Plan: Cashflow Period Filter

## Overview

Implementasi filter periode pada komponen Arus Kas (CashFlowChart) di dashboard FinTrack. Komponen akan di-refactor dari menerima prop `transactions` menjadi self-contained dengan state navigasi periode dan data fetching sendiri, menggunakan infrastruktur `cycle-utils.ts` dan `useCutoffDate` yang sudah ada.

## Tasks

- [x] 1. Buat fungsi utilitas navigasi dan format label periode
  - [x] 1.1 Tambahkan fungsi `canNavigateCashFlowNext`, `getPreviousCashFlowPeriod`, `getNextCashFlowPeriod`, dan `formatCashFlowPeriodLabel` di file baru `src/lib/cashflow-utils.ts`
    - `canNavigateCashFlowNext(month, year)`: return false jika periode >= periode berjalan
    - `getPreviousCashFlowPeriod(month, year)`: return {month, year} sebelumnya
    - `getNextCashFlowPeriod(month, year)`: return {month, year} berikutnya
    - `formatCashFlowPeriodLabel(cycleRange, cutoffDate)`: return label string sesuai format
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 1.2 Tulis property tests untuk fungsi utilitas navigasi dan format
    - **Property 1: Navigasi periode round-trip**
    - **Property 2: Constraint navigasi ke depan**
    - **Property 3: Format label periode**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7**

- [x] 2. Buat hook `useCashFlowTransactions` dan refactor `buildDailyData`
  - [x] 2.1 Buat hook `useCashFlowTransactions` di `src/hooks/useCashFlowTransactions.ts`
    - Menerima `{ month, year, cutoffDate }`
    - Menghitung CycleRange via `getCycleRangeForMonth`
    - Query transaksi dari Supabase dengan filter `date >= start` dan `date < end`
    - Return `{ data, isLoading, error, cycleRange }`
    - _Requirements: 2.1, 2.3, 5.1, 5.2_

  - [x] 2.2 Refactor fungsi `buildDailyData` di `src/components/dashboard/CashFlowChart.tsx`
    - Tambahkan parameter `cycleRange` untuk menentukan label cross-month
    - Ubah field `day` menjadi `label` (format: "25" atau "1 Feb" saat pergantian bulan)
    - Tambahkan field `fullDate` untuk tooltip
    - _Requirements: 2.4, 4.1, 4.2_

  - [ ]* 2.3 Tulis property tests untuk `buildDailyData` dan filter transaksi
    - **Property 4: Kebenaran filter transaksi**
    - **Validates: Requirements 2.1, 2.4**

- [x] 3. Buat komponen `CashFlowPeriodSelector`
  - [x] 3.1 Buat komponen `CashFlowPeriodSelector` di `src/components/dashboard/CashFlowPeriodSelector.tsx`
    - Mengikuti pola UI dari `src/components/reports/PeriodSelector.tsx`
    - Menerima props: month, year, cutoffDate, cycleRange, onPrevious, onNext, canGoNext
    - Menampilkan label via `formatCashFlowPeriodLabel`
    - Tombol navigasi dengan aria-labels dan disabled state
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 5.1_

  - [ ]* 3.2 Tulis unit tests untuk `CashFlowPeriodSelector`
    - Test rendering label untuk cutoff=1 dan cutoff>1
    - Test disabled state tombol next
    - Test aksesibilitas (aria-labels, role group)
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

- [x] 4. Buat komponen `CashFlowSummary`
  - [x] 4.1 Buat komponen `CashFlowSummary` di `src/components/dashboard/CashFlowSummary.tsx`
    - Menerima props: totalIncome, totalExpenses, netChange
    - Tampilkan 3 metrik dalam satu baris dengan format IDR
    - Warna hijau untuk positif, merah untuk negatif pada netChange
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 4.2 Tulis property test untuk perhitungan ringkasan
    - **Property 5: Kebenaran perhitungan ringkasan**
    - **Validates: Requirements 3.1**

  - [ ]* 4.3 Tulis unit tests untuk `CashFlowSummary`
    - Test warna indikator positif/negatif
    - Test format angka IDR
    - _Requirements: 3.2, 3.3_

- [x] 5. Refactor `CashFlowChart` dan integrasi semua komponen
  - [x] 5.1 Refactor `CashFlowChart` di `src/components/dashboard/CashFlowChart.tsx`
    - Hapus prop `transactions`, komponen fetch data sendiri via `useCashFlowTransactions`
    - Tambahkan state `month`/`year` (inisialisasi dari periode berjalan)
    - Integrasikan `CashFlowPeriodSelector` dan `CashFlowSummary`
    - Perbaiki tooltip untuk menampilkan tanggal lengkap dan format Rupiah
    - Tampilkan empty state dengan informasi rentang periode jika tidak ada data
    - _Requirements: 1.1, 1.2, 2.3, 3.4, 4.3, 4.4_

  - [x] 5.2 Update `DashboardPage` untuk menggunakan `CashFlowChart` tanpa prop
    - Hapus passing `transactions` ke `CashFlowChart`
    - Hapus dependency `useCurrentMonthTransactions` dari CashFlowChart rendering logic
    - _Requirements: 5.2, 5.3_

  - [ ]* 5.3 Tulis unit tests untuk `CashFlowChart` terintegrasi
    - Test rendering dengan mock data
    - Test empty state message mengandung rentang periode
    - Test navigasi periode mengubah data yang ditampilkan
    - _Requirements: 1.1, 2.3, 4.4_

- [x] 6. Checkpoint - Pastikan semua tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa dilewati untuk MVP lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Infrastruktur `cycle-utils.ts` dan `useCutoffDate` sudah tersedia, tidak perlu dibuat ulang
- Pola UI mengikuti `PeriodSelector` yang sudah ada di reports
- `useCurrentMonthTransactions` di `MonthlySummaryCard.tsx` tetap dipertahankan (digunakan oleh komponen lain)
