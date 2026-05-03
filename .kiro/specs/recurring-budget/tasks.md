# Implementation Plan: Recurring Budget

## Overview

Implementasi fitur recurring budget secara inkremental: mulai dari schema database, update types, modifikasi form, lalu logika carry-over. Menggunakan TypeScript, React hooks, dan Supabase.

## Tasks

- [x] 1. Tambahkan kolom `is_recurring` ke tabel budgets
  - [x] 1.1 Buat migration `supabase/migrations/00012_recurring_budget.sql`
    - ALTER TABLE budgets ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Update interface `Budget` di `src/types/index.ts`
    - Tambahkan field `is_recurring: boolean` ke interface Budget
    - _Requirements: 1.1_

- [x] 2. Modifikasi BudgetForm untuk mendukung toggle recurring
  - [x] 2.1 Tambahkan checkbox "Anggaran Berulang" di `src/components/budgets/BudgetForm.tsx`
    - Tambahkan state `isRecurring` (default false, atau dari budget.is_recurring saat edit)
    - Tambahkan checkbox UI di antara field limit amount dan tombol aksi
    - Update `BudgetFormProps.onSubmit` untuk menyertakan `is_recurring` dalam data
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Update `useCreateBudget` di `src/hooks/useBudgets.ts`
    - Tambahkan `is_recurring` ke insert payload
    - Update type `BudgetFormInput` di `src/types/index.ts` untuk menyertakan `is_recurring`
    - _Requirements: 2.2_

  - [x] 2.3 Update `useUpdateBudget` di `src/hooks/useBudgets.ts`
    - Tambahkan `is_recurring` opsional ke mutation parameters
    - Sertakan `is_recurring` dalam update fields jika disediakan
    - _Requirements: 2.3, 2.4_

  - [x] 2.4 Update halaman budgets (`src/app/(protected)/budgets/page.tsx`)
    - Pastikan handleCreate dan handleEdit meneruskan `is_recurring` ke hooks
    - _Requirements: 2.2, 2.4_

  - [ ]* 2.5 Tulis unit test untuk BudgetForm toggle recurring
    - Test render checkbox saat create mode (default unchecked)
    - Test render checkbox saat edit mode (reflect current state)
    - Test submit menyertakan is_recurring dalam data
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Pastikan form berfungsi
  - Pastikan semua test lulus, tanyakan ke pengguna jika ada pertanyaan.

- [x] 4. Implementasi logika carry-over
  - [x] 4.1 Tambahkan utility `getPreviousMonth` di `src/lib/cycle-utils.ts`
    - Input: "YYYY-MM-01" → Output: bulan sebelumnya "YYYY-MM-01"
    - Handle pergantian tahun (Januari → Desember tahun sebelumnya)
    - _Requirements: 3.1_

  - [x] 4.2 Buat hook `useCarryOverBudgets` di `src/hooks/useCarryOverBudgets.ts`
    - Query recurring budgets dari bulan sebelumnya (is_recurring=true)
    - Query budgets yang sudah ada di bulan berjalan
    - Filter: recurring budgets yang category_id-nya belum ada di bulan berjalan
    - Untuk setiap budget yang perlu di-carry over, ambil limit_amount dari budget recurring terbaru (month terbesar) untuk kategori tersebut
    - Batch insert budget baru dengan is_recurring=true
    - Invalidate budget query cache setelah insert
    - Handle constraint violation 23505 dengan skip (tanpa error)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 5.1_

  - [x] 4.3 Integrasikan `useCarryOverBudgets` di halaman budgets
    - Panggil hook di `src/app/(protected)/budgets/page.tsx`
    - Trigger carry-over saat halaman dimuat dengan bulan berjalan
    - _Requirements: 3.1_

  - [ ]* 4.4 Tulis property test: carry-over hanya untuk recurring budgets
    - **Property 2: Carry-over hanya untuk recurring budgets**
    - Generate random sets of budgets (mix recurring/non-recurring)
    - Verify hanya recurring yang muncul di bulan baru
    - **Validates: Requirements 3.1, 3.3, 3.5, 5.1, 5.2**

  - [ ]* 4.5 Tulis property test: carry-over idempoten
    - **Property 3: Carry-over bersifat idempoten**
    - Run carry-over dua kali, verify hasil identik
    - **Validates: Requirements 3.4**

  - [ ]* 4.6 Tulis property test: last amount selection
    - **Property 4: Last amount selection**
    - Generate recurring budgets di beberapa bulan dengan amount berbeda
    - Verify carry-over menggunakan amount dari bulan terbaru
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 4.7 Tulis property test: disable recurring stops carry-over
    - **Property 5: Menonaktifkan recurring menghentikan carry-over**
    - Set is_recurring=false, verify tidak di-carry over
    - **Validates: Requirements 2.4**

- [x] 5. Checkpoint - Pastikan carry-over berfungsi
  - Pastikan semua test lulus, tanyakan ke pengguna jika ada pertanyaan.

- [x] 6. Update tampilan budget list untuk indikator recurring
  - [x] 6.1 Tambahkan indikator visual recurring di daftar budget
    - Tampilkan ikon atau badge kecil pada budget yang is_recurring=true
    - Bisa berupa ikon 🔄 atau label "Berulang" di samping nama kategori
    - _Requirements: 2.1_

- [x] 7. Final checkpoint
  - Pastikan semua test lulus, tanyakan ke pengguna jika ada pertanyaan.

## Catatan

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk traceability
- Property test menggunakan fast-check dengan minimum 100 iterasi
- Carry-over menggunakan strategi lazy generation (saat halaman dibuka), bukan cron job
- Unique constraint (user_id, category_id, month) yang sudah ada mencegah duplikasi saat carry-over
