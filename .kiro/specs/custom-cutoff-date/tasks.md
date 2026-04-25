# Implementation Plan: Custom Cutoff Date (Tanggal Gajian)

## Overview

Implementasi mengikuti pendekatan bottom-up: mulai dari migrasi database, lalu utilitas cycle range, hook, UI pengaturan, dan terakhir update semua komponen yang terpengaruh. Setiap langkah membangun di atas langkah sebelumnya. Property-based test menggunakan fast-check.

## Tasks

- [x] 1. Migrasi database dan update tipe TypeScript
  - [x] 1.1 Buat file migrasi `supabase/migrations/00008_cutoff_date.sql` yang menambahkan kolom `cutoff_date INTEGER NOT NULL DEFAULT 1 CHECK (cutoff_date >= 1 AND cutoff_date <= 28)` ke tabel `user_profiles`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Update interface `UserProfile` di `src/types/index.ts` dengan menambahkan field `cutoff_date: number`
    - _Requirements: 1.1_

- [x] 2. Buat utilitas cycle range terpusat
  - [x] 2.1 Buat file `src/lib/cycle-utils.ts` dengan fungsi `getCycleRange`, `getCycleBudgetMonth`, `getCycleRangeForMonth`, dan helper `formatDate`
    - Implementasi sesuai design document bagian Components and Interfaces #2
    - Export interface `CycleRange`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 2.2 Tulis property tests untuk cycle-utils
    - **Property 1: Output Validity — getCycleRange menghasilkan tanggal valid**
    - **Validates: Requirements 3.1, 3.6**
    - **Property 2: Invariant start < end**
    - **Validates: Requirements 3.5**
    - **Property 3: Cycle Start Date Correctness**
    - **Validates: Requirements 3.3, 3.4**
    - **Property 4: Backward Compatibility — cutoff=1 sama dengan bulan kalender**
    - **Validates: Requirements 3.2, 5.2, 6.2, 7.2, 8.4, 9.1**
    - **Property 5: Round-trip — Budget Month ↔ Cycle Range**
    - **Validates: Requirements 9.2**
  - [ ]* 2.3 Tulis unit tests untuk cycle-utils
    - Test contoh spesifik: cutoff=1, cutoff=25 dengan berbagai reference date, pergantian tahun
    - Test getCycleRangeForMonth dan getCycleBudgetMonth dengan contoh spesifik
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Buat hook useCutoffDate
  - [x] 3.1 Buat file `src/hooks/useCutoffDate.ts` yang mengambil `cutoff_date` dari `user_profiles` via Supabase, mengembalikan `{ cutoffDate, isLoading }` dengan default 1
    - Gunakan Tanstack Query untuk caching
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Tambah pengaturan cutoff date di Settings
  - [x] 5.1 Tambahkan komponen `CutoffDateSection` di `src/app/(protected)/settings/page.tsx` dengan select 1-28, penjelasan singkat, dan tombol simpan
    - Ikuti pola yang sama dengan `NotificationSettingsSection`
    - Invalidate query cache `['user-profile', 'cutoff-date']` setelah save berhasil
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Update useBudgets dengan cutoff date
  - [x] 6.1 Update `src/hooks/useBudgets.ts`: tambahkan parameter `cutoffDate` ke `fetchBudgetsWithSpending` dan `useBudgets`, ganti logika bulan kalender dengan `getCycleRangeForMonth`
    - Update query key agar include cutoffDate
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Update MonthlySummaryCard dengan cutoff date
  - [x] 7.1 Update `src/components/dashboard/MonthlySummaryCard.tsx`: ganti `useCurrentMonthTransactions` agar menggunakan `useCutoffDate` dan `getCycleRange` untuk menentukan rentang query
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Update BudgetProgressSection dengan cutoff date
  - [x] 8.1 Update `src/components/dashboard/BudgetProgressSection.tsx`: ganti `getCurrentMonth()` dengan `getCycleRange` + `getCycleBudgetMonth` menggunakan cutoff date dari `useCutoffDate`, dan teruskan cutoffDate ke `useBudgets`
    - _Requirements: 7.1, 7.2_

- [x] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update useReports dengan cutoff date
  - [x] 10.1 Update `src/hooks/useReports.ts`: tambahkan `cutoffDate` ke `UseReportsParams`, ganti `getMonthDateRange` dan `getTrendDateRange` agar menggunakan `getCycleRangeForMonth`
    - Update semua query keys agar include cutoffDate
    - Update monthly range, trend range, dan previous month range calculations
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 10.2 Update komponen Reports page yang memanggil `useReports` agar meneruskan `cutoffDate` dari `useCutoffDate`
    - _Requirements: 8.1_

- [x] 11. Update BudgetForm default month
  - [x] 11.1 Update `src/components/budgets/BudgetForm.tsx`: ganti `getCurrentMonth()` agar menggunakan `getCycleRange` + `getCycleBudgetMonth` dengan cutoff date, sehingga default bulan anggaran baru sesuai siklus aktif
    - Tambahkan prop `cutoffDate` atau gunakan `useCutoffDate` di dalam form
    - _Requirements: 9.2_

- [x] 12. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `fast-check` sudah tersedia di project dari spec sebelumnya
- Jika cutoff_date = 1 (default), semua komponen berperilaku identik dengan sebelumnya — zero behavioral change untuk pengguna existing
- Skema tabel `budgets` dan `transactions` tidak berubah
- Field `month` pada budget diinterpretasikan sebagai bulan di mana siklus dimulai
