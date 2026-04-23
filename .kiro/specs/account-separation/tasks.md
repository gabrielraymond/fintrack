# Implementation Plan: Pemisahan Akun (Account Separation)

## Overview

Implementasi mengikuti pendekatan bottom-up: mulai dari utilitas klasifikasi terpusat, lalu hook perhitungan, lalu komponen UI. Setiap langkah membangun di atas langkah sebelumnya. Property-based test menggunakan fast-check.

## Tasks

- [x] 1. Buat utilitas Account Classifier
  - [x] 1.1 Buat file `src/lib/accountClassifier.ts` dengan konstanta `OPERATIONAL_ACCOUNT_TYPES`, `SAVINGS_ACCOUNT_TYPES`, fungsi `classifyAccountType`, `partitionAccounts`, dan `sumBalance`
    - Implementasi sesuai design document bagian Components and Interfaces #1
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 1.2 Tulis property test untuk partisi akun
    - **Property 1: Partisi akun lengkap dan benar**
    - **Validates: Requirements 1.4, 1.1, 1.2**
  - [ ]* 1.3 Tulis unit test untuk `classifyAccountType` dan `partitionAccounts`
    - Test setiap AccountType diklasifikasikan dengan benar
    - Test daftar kosong, daftar campuran, daftar hanya satu kelompok
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 2. Update hook useNetWorth dengan breakdown
  - [x] 2.1 Tambahkan `calculateNetWorthBreakdown` di `src/hooks/useNetWorth.ts` yang mengembalikan `{ total, operational, savings }` menggunakan `partitionAccounts` dan `sumBalance`
    - Pertahankan fungsi `calculateNetWorth` yang sudah ada untuk backward compatibility
    - Update `useNetWorth` hook agar mengembalikan breakdown selain netWorth
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 2.7_
  - [ ]* 2.2 Tulis property test untuk invariant net worth breakdown
    - **Property 2: Invariant net worth breakdown**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [ ]* 2.3 Tulis unit test untuk `calculateNetWorthBreakdown`
    - Test dengan saldo positif, negatif, nol, dan akun soft-deleted
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update NetWorthCard untuk menampilkan breakdown
  - [x] 4.1 Update `src/components/dashboard/NetWorthCard.tsx` agar menerima props `total`, `operational`, `savings` dan menampilkan tiga nilai dengan label yang sesuai
    - Total kekayaan bersih sebagai nilai utama (besar)
    - Saldo operasional dan simpanan sebagai dua nilai sekunder berdampingan
    - Label: "Kekayaan Bersih", "Saldo Operasional", "Simpanan & Investasi"
    - Warna merah untuk nilai negatif
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 4.2 Update `src/app/(protected)/dashboard/page.tsx` untuk meneruskan breakdown dari `useNetWorth` ke `NetWorthCard`
    - _Requirements: 2.1, 2.7_

- [x] 5. Pisahkan AccountSummaryStrip di dashboard
  - [x] 5.1 Update `src/components/dashboard/AccountSummaryStrip.tsx` untuk mendukung prop `label` opsional yang ditampilkan sebagai heading di atas strip
    - _Requirements: 3.2, 3.3_
  - [x] 5.2 Update `src/app/(protected)/dashboard/page.tsx` untuk merender dua AccountSummaryStrip terpisah menggunakan `partitionAccounts`: satu dengan label "Akun Operasional" dan satu dengan label "Simpanan & Investasi"
    - Sembunyikan strip jika kelompok akun kosong
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Filter akun di AccountStep berdasarkan tipe transaksi
  - [x] 6.1 Update `src/components/transactions/TransactionModal/AccountStep.tsx` untuk memfilter akun: hanya Operational_Account untuk expense/income, semua akun untuk transfer
    - Import `classifyAccountType` dari accountClassifier
    - Tambahkan pesan khusus jika tidak ada akun operasional untuk expense/income
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 6.2 Tulis property test untuk filter akun transaksi
    - **Property 3: Filter akun transaksi berdasarkan tipe**
    - **Validates: Requirements 4.1, 4.2**

- [x] 7. Update halaman akun
  - [x] 7.1 Update `src/app/(protected)/accounts/page.tsx` untuk menggunakan `partitionAccounts` sehingga `investment` masuk ke bagian simpanan, dan ubah label bagian menjadi "Tabungan, Investasi & Dana Darurat"
    - Sembunyikan bagian jika kelompok kosong
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Tidak ada perubahan database atau API — semua perubahan di frontend
- `fast-check` perlu diinstall sebagai dev dependency jika belum ada
- Property tests memvalidasi kebenaran universal, unit tests memvalidasi contoh spesifik dan edge case
