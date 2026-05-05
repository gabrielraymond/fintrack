# Rencana Implementasi: Installment & Commitment Tracker

## Ikhtisar

Implementasi fitur Installment & Commitment Tracker dilakukan secara bertahap dari bawah ke atas: migrasi database → tipe TypeScript → fungsi kalkulasi murni → hooks TanStack Query → komponen UI → halaman `/commitments` → integrasi ke halaman Akun → notifikasi → property-based tests.

## Tasks

- [x] 1. Migrasi database: tabel baru dan perubahan skema
  - [x] 1.1 Buat file migrasi `supabase/migrations/00013_installment_tracker.sql`
    - Tambahkan kolom `commitment_limit BIGINT` (nullable) ke tabel `accounts`
    - Buat tabel `installments` dengan kolom: id, user_id, account_id, name, installment_type (CHECK 'cc','non_cc'), monthly_amount (CHECK > 0), tenor_months (CHECK >= 1), start_date, due_day (CHECK 1-31), note, status (CHECK 'active','completed'), created_at, updated_at
    - Aktifkan RLS pada `installments` dan buat policy "Users can only access own installments" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
    - Buat index `idx_installments_user_status` pada (user_id, status) dan `idx_installments_user_account` pada (user_id, account_id)
    - Buat tabel `recurring_commitments` dengan kolom: id, user_id, account_id, name, monthly_amount (CHECK > 0), is_active (DEFAULT true), note, created_at, updated_at
    - Aktifkan RLS pada `recurring_commitments` dan buat policy "Users can only access own recurring_commitments"
    - Buat index `idx_recurring_commitments_user_active` pada (user_id, is_active) dan `idx_recurring_commitments_user_account` pada (user_id, account_id)
    - Buat tabel `installment_payment_logs` dengan kolom: id, installment_id (FK ON DELETE CASCADE), user_id, payment_month (DATE, format YYYY-MM-01), status (CHECK 'paid','unpaid', DEFAULT 'unpaid'), confirmed_at, created_at; UNIQUE (installment_id, payment_month)
    - Aktifkan RLS pada `installment_payment_logs` dan buat policy "Users can only access own payment_logs"
    - Buat index `idx_payment_logs_installment_month` pada (installment_id, payment_month) dan `idx_payment_logs_user_month` pada (user_id, payment_month)
    - Update constraint `notifications_type_check` untuk menambahkan tipe `payment_due_today` dan `commitment_alert`
    - _Requirements: 1.1, 1.6, 2.1, 2.4, 8.1, 8.4, 9.1_

- [x] 2. Update tipe TypeScript di `src/types/index.ts`
  - [x] 2.1 Tambahkan tipe dan interface baru untuk fitur ini
    - Tambahkan `InstallmentType = 'cc' | 'non_cc'`, `InstallmentStatus = 'active' | 'completed'`, `PaymentLogStatus = 'paid' | 'unpaid'`
    - Tambahkan tipe `payment_due_today` dan `commitment_alert` ke `NotificationType`
    - Tambahkan interface `Installment` dengan semua kolom dari tabel `installments`
    - Tambahkan interface `RecurringCommitment` dengan semua kolom dari tabel `recurring_commitments`
    - Tambahkan interface `InstallmentPaymentLog` dengan semua kolom dari tabel `installment_payment_logs`
    - Tambahkan interface `InstallmentFormInput` dan `RecurringCommitmentFormInput`
    - Tambahkan `commitment_limit: number | null` ke interface `Account`
    - Tambahkan `commitment_limit?: number` ke interface `AccountFormInput`
    - _Requirements: 1.1, 1.2, 2.1, 6.1, 6.2_

- [x] 3. Implementasi fungsi kalkulasi murni di `src/lib/limitCalculations.ts`
  - [x] 3.1 Buat file `src/lib/limitCalculations.ts` dengan semua pure functions
    - Implementasikan `isInstallmentDeducted(today: Date, dueDay: number): boolean` — mengembalikan `true` jika `today.getDate() >= dueDay`
    - Implementasikan `calculateRemainingTenor(startDate: Date, tenorMonths: number, today: Date): number` — mengembalikan `max(0, (tahun_akhir * 12 + bulan_akhir) - (tahun_sekarang * 12 + bulan_sekarang))`
    - Implementasikan `calculateRemainingDebt(monthlyAmount: number, remainingTenor: number): number` — mengembalikan `monthlyAmount * remainingTenor`
    - Implementasikan `calculateTotalMonthlyObligation(installments: Installment[], commitments: RecurringCommitment[]): number` — jumlah semua `monthly_amount` aktif
    - Implementasikan `calculateCurrentEffectiveLimitCC(creditLimit, installments, commitments, today)` — `credit_limit - sum(CC yang sudah terpotong) - sum(komitmen yang due_day <= hari ini)`
    - Implementasikan `calculateCurrentEffectiveLimitNonCC(commitmentLimit, installments, commitments, paymentLogs, today)` — `commitment_limit - sum(Non-CC yang paid bulan ini) - sum(komitmen yang due_day <= hari ini)`
    - Implementasikan `calculateProjectedEffectiveLimit(limit, totalMonthlyObligation)` — mengembalikan `limit - totalMonthlyObligation`
    - _Requirements: 1.3, 1.4, 1a.1, 1a.2, 1b.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Tulis property test untuk `isInstallmentDeducted`
    - **Property 4: Status Angsuran_Sudah_Terpotong**
    - **Validates: Requirements 1a.1**

  - [ ]* 3.3 Tulis property test untuk `calculateRemainingTenor` dan `calculateRemainingDebt`
    - **Property 2: Kalkulasi Sisa Tenor dan Total Sisa Hutang**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 3.4 Tulis property test untuk `calculateTotalMonthlyObligation`
    - **Property 7: Total_Kewajiban_Bulanan adalah Jumlah Semua Kewajiban Aktif**
    - **Validates: Requirements 3.1, 2.3**

  - [ ]* 3.5 Tulis property test untuk `calculateProjectedEffectiveLimit`
    - **Property 8: Prediksi_Limit_Tagihan = Limit - Total_Kewajiban_Bulanan**
    - **Validates: Requirements 3.3, 3.5**

  - [ ]* 3.6 Tulis property test untuk `calculateCurrentEffectiveLimitCC` dan `calculateCurrentEffectiveLimitNonCC`
    - **Property 9: Limit_Real_Sekarang Mencerminkan Kewajiban yang Sudah Terealisasi**
    - **Validates: Requirements 3.2, 3.4**

- [x] 4. Checkpoint — Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 5. Implementasi hooks TanStack Query
  - [x] 5.1 Buat `src/hooks/useInstallments.ts`
    - Definisikan `installmentKeys` query key factory (all, active, completed, paymentLogs)
    - Implementasikan `useActiveInstallments()` — query ke tabel `installments` dengan filter `status = 'active'`
    - Implementasikan `useCompletedInstallments()` — query ke tabel `installments` dengan filter `status = 'completed'`
    - Implementasikan `useInstallmentPaymentLogs(month: string)` — query ke tabel `installment_payment_logs` dengan filter `payment_month = month`
    - Implementasikan `useCreateInstallment()` — mutation insert ke `installments`; set `installment_type` otomatis dari tipe akun yang dipilih; invalidate `installmentKeys.all`
    - Implementasikan `useUpdateInstallment()` — mutation update; invalidate `installmentKeys.all`
    - Implementasikan `useDeleteInstallment()` — mutation delete; invalidate `installmentKeys.all`
    - Implementasikan `useConfirmPayment()` — mutation upsert ke `installment_payment_logs` dengan status `paid` dan `confirmed_at = now()`; invalidate `installmentKeys.paymentLogs`
    - Semua mutation menampilkan Error_Toast pada onError mengikuti pola yang ada di `useGoals.ts`
    - _Requirements: 1.1, 1.2, 1b.3, 5.1, 5.2, 5.5_

  - [x] 5.2 Buat `src/hooks/useRecurringCommitments.ts`
    - Definisikan `commitmentKeys` query key factory (all, active, all_list)
    - Implementasikan `useActiveCommitments()` — query ke tabel `recurring_commitments` dengan filter `is_active = true`
    - Implementasikan `useCreateCommitment()` — mutation insert; invalidate `commitmentKeys.all`
    - Implementasikan `useUpdateCommitment()` — mutation update; invalidate `commitmentKeys.all`
    - Implementasikan `useDeleteCommitment()` — mutation delete; invalidate `commitmentKeys.all`
    - Implementasikan `useToggleCommitmentActive()` — mutation update `is_active`; invalidate `commitmentKeys.all`
    - Semua mutation menampilkan Error_Toast pada onError
    - _Requirements: 2.1, 2.3, 5.3, 5.4, 5.5_

  - [x] 5.3 Buat `src/hooks/useCommitmentLimits.ts`
    - Definisikan interface `AccountLimitData` dengan `accountId`, `totalMonthlyObligation`, `currentEffectiveLimit`, `projectedEffectiveLimit`
    - Implementasikan `useCommitmentLimits(accounts: Account[])` — hook komposit yang memanggil `useActiveInstallments`, `useActiveCommitments`, `useInstallmentPaymentLogs(currentMonth)`, lalu memanggil fungsi dari `limitCalculations.ts` untuk setiap akun
    - Kembalikan `{ data: Record<string, AccountLimitData>, isLoading: boolean }`
    - Jika akun tidak memiliki `credit_limit` (CC) atau `commitment_limit` (non-CC), set `currentEffectiveLimit` dan `projectedEffectiveLimit` ke `null`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3_

- [x] 6. Implementasi komponen form
  - [x] 6.1 Buat `src/components/commitments/InstallmentForm.tsx`
    - Implementasikan modal form dengan field: nama, akun (dropdown semua tipe), angsuran bulanan (IDR), tenor (bulan), tanggal mulai, tanggal jatuh tempo (1-31), catatan (opsional)
    - Tipe cicilan TIDAK ditampilkan di form — ditentukan otomatis dari tipe akun yang dipilih
    - Validasi client-side: tenor >= 1, angsuran > 0, due_day antara 1-31; tampilkan pesan error inline
    - Dukung mode tambah (installment = null) dan mode edit (installment = data yang ada)
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.8_

  - [ ]* 6.2 Tulis unit test untuk `InstallmentForm`
    - Test semua field ditampilkan dengan benar
    - Test tipe cicilan ditentukan otomatis berdasarkan tipe akun
    - Test validasi: tenor < 1, angsuran <= 0, due_day di luar 1-31 ditolak
    - _Requirements: 1.2, 1.6_

  - [ ]* 6.3 Tulis property test untuk validasi input `InstallmentForm`
    - **Property 3: Validasi Input Cicilan dan Komitmen**
    - **Validates: Requirements 1.6, 2.4**

  - [ ]* 6.4 Tulis property test untuk penentuan tipe cicilan otomatis
    - **Property 1: Penentuan Tipe Cicilan Otomatis**
    - **Validates: Requirements 1.2**

  - [x] 6.5 Buat `src/components/commitments/RecurringCommitmentForm.tsx`
    - Implementasikan modal form dengan field: nama, akun (dropdown semua tipe), jumlah per bulan (IDR), catatan (opsional)
    - Validasi client-side: jumlah > 0; tampilkan pesan error inline
    - Dukung mode tambah dan mode edit
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 7. Implementasi komponen kartu dan ringkasan
  - [x] 7.1 Buat `src/components/commitments/InstallmentCard.tsx`
    - Tampilkan: nama cicilan, tipe (CC/Non-CC), angsuran bulanan (format IDR), tanggal jatuh tempo, sisa tenor ("X bulan lagi"), total sisa hutang (format IDR)
    - Untuk Cicilan_CC: tampilkan badge "Sudah terpotong" (jika hari ini >= due_day) atau "Belum jatuh tempo"
    - Untuk Cicilan_Non_CC: tampilkan badge "Sudah dibayar" atau "Belum dibayar" + tombol konfirmasi jika status `unpaid`
    - Tampilkan tombol edit dan hapus
    - _Requirements: 1a.4, 1b.2, 1b.3, 4.3, 4.4, 4.5, 10.1, 10.2_

  - [ ]* 7.2 Tulis unit test untuk `InstallmentCard`
    - Test badge "Sudah terpotong" muncul untuk Cicilan_CC dengan due_day <= hari ini
    - Test tombol konfirmasi muncul untuk Cicilan_Non_CC dengan status unpaid
    - Test format IDR pada semua nilai moneter
    - Test label "X bulan lagi" pada sisa tenor
    - _Requirements: 1a.4, 1b.2, 10.1, 10.2_

  - [x] 7.3 Buat `src/components/commitments/RecurringCommitmentCard.tsx`
    - Tampilkan: nama komitmen, jumlah per bulan (format IDR), status aktif/tidak aktif
    - Tampilkan toggle untuk mengaktifkan/menonaktifkan komitmen
    - Tampilkan tombol edit dan hapus
    - _Requirements: 2.3, 4.6, 10.1_

  - [x] 7.4 Buat `src/components/commitments/AccountLimitSummary.tsx`
    - Tampilkan: nama akun, limit resmi (credit_limit atau commitment_limit), Total_Kewajiban_Bulanan, Limit_Real_Sekarang (label: "Limit Sekarang"), Prediksi_Limit_Tagihan (label: "Prediksi Setelah Tagihan")
    - Jika limit tidak dikonfigurasi, tampilkan "Tidak dikonfigurasi" untuk Limit_Real_Sekarang dan Prediksi_Limit_Tagihan
    - Jika Prediksi_Limit_Tagihan negatif, tampilkan dengan warna merah (kelas CSS danger)
    - Semua nilai moneter diformat IDR
    - _Requirements: 3.6, 3.7, 4.1, 4.9, 6.3, 10.1_

  - [ ]* 7.5 Tulis unit test untuk `AccountLimitSummary`
    - Test menampilkan "Tidak dikonfigurasi" jika limit tidak diset
    - Test nilai negatif ditampilkan dengan kelas CSS danger
    - Test label "Limit Sekarang" dan "Prediksi Setelah Tagihan" muncul
    - _Requirements: 3.6, 3.7, 4.9, 6.3_

- [x] 8. Checkpoint — Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 9. Buat halaman `/commitments`
  - [x] 9.1 Buat `src/app/(protected)/commitments/page.tsx`
    - Tampilkan baris ringkasan total kewajiban semua akun di bagian atas halaman
    - Tampilkan daftar akun yang memiliki cicilan/komitmen aktif, masing-masing dengan `AccountLimitSummary`
    - Ketika User memilih akun, tampilkan daftar `InstallmentCard` dan `RecurringCommitmentCard` untuk akun tersebut
    - Tampilkan tombol "Tambah Cicilan" dan "Tambah Komitmen" yang membuka form modal
    - Tampilkan empty state jika tidak ada cicilan/komitmen: pesan yang mengajak User menambahkan cicilan atau komitmen pertama
    - Tampilkan `Skeleton_Loader` saat data sedang dimuat
    - Dukung query param `?account={id}` untuk pre-select akun (navigasi dari AccountCard)
    - Wire semua hooks: `useActiveInstallments`, `useActiveCommitments`, `useInstallmentPaymentLogs`, `useCommitmentLimits`, `useCreateInstallment`, `useUpdateInstallment`, `useDeleteInstallment`, `useConfirmPayment`, `useCreateCommitment`, `useUpdateCommitment`, `useDeleteCommitment`, `useToggleCommitmentActive`
    - Tampilkan Confirmation_Dialog sebelum menghapus cicilan atau komitmen
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 3.8, 5.2, 5.4, 10.3_

  - [ ]* 9.2 Tulis unit test untuk halaman Tracker
    - Test empty state ditampilkan jika tidak ada cicilan/komitmen
    - Test daftar akun ditampilkan jika ada cicilan/komitmen aktif
    - _Requirements: 4.7_

- [x] 10. Tambahkan halaman Commitments ke navigasi
  - [x] 10.1 Update `src/components/layout/Sidebar.tsx` dan `src/components/layout/BottomNav.tsx`
    - Tambahkan link navigasi ke `/commitments` dengan label "Cicilan" dan ikon yang sesuai
    - _Requirements: 4.1_

- [-] 11. Integrasi ke halaman Akun: `AccountCommitmentIndicator` dan `AccountForm`
  - [x] 11.1 Buat `src/components/accounts/AccountCommitmentIndicator.tsx`
    - Tampilkan ringkasan kecil: Total_Kewajiban_Bulanan, Limit_Real_Sekarang, Prediksi_Limit_Tagihan (format IDR)
    - Komponen ini hanya ditampilkan jika akun memiliki cicilan atau komitmen aktif
    - Klik pada komponen ini menavigasi ke `/commitments?account={id}`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 11.2 Tulis unit test untuk `AccountCommitmentIndicator`
    - Test komponen tidak ditampilkan jika tidak ada kewajiban aktif
    - Test navigasi ke `/commitments?account={id}` saat diklik
    - _Requirements: 7.2, 7.3_

  - [x] 11.3 Update `src/components/accounts/AccountCard.tsx`
    - Tambahkan `AccountCommitmentIndicator` di bawah informasi saldo jika akun memiliki kewajiban aktif
    - Terima prop tambahan `limitData?: AccountLimitData` dari halaman Akun
    - _Requirements: 7.1, 7.3_

  - [x] 11.4 Update `src/components/accounts/AccountForm.tsx`
    - Tambahkan field opsional `Batas Komitmen (IDR)` yang muncul saat tipe akun BUKAN `credit_card`
    - Sertakan `commitment_limit` dalam data yang dikirim ke `onSubmit`
    - _Requirements: 6.1, 6.2_

  - [ ]* 11.5 Tulis unit test untuk `AccountForm` dengan field `commitment_limit`
    - Test field `Batas Komitmen` muncul untuk akun non-CC
    - Test field `Batas Komitmen` tidak muncul untuk akun `credit_card`
    - _Requirements: 6.1_

  - [x] 11.6 Update `src/hooks/useAccounts.ts`
    - Sertakan `commitment_limit` dalam payload `useCreateAccount` dan `useUpdateAccount`
    - _Requirements: 6.2_

  - [x] 11.7 Update `src/app/(protected)/accounts/page.tsx`
    - Panggil `useCommitmentLimits` untuk mendapatkan data limit per akun
    - Teruskan `limitData` ke setiap `AccountCard`
    - _Requirements: 7.1_

- [x] 12. Checkpoint — Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 13. Implementasi notifikasi cicilan
  - [x] 13.1 Perluas `src/lib/notifications.ts` dengan fungsi notifikasi cicilan
    - Implementasikan `evaluateCommitmentAlerts(userId, accounts, installments, commitments)` — untuk setiap akun dengan limit yang dikonfigurasi, hitung Prediksi_Limit_Tagihan; jika < 10% dari limit resmi, buat notifikasi `commitment_alert`; jika negatif, gunakan pesan "kewajiban telah melebihi limit"; gunakan dedup key `commitment_alert:{accountId}:{YYYY-MM-DD}`
    - Implementasikan `evaluatePaymentDueToday(userId, installments, today)` — untuk setiap cicilan aktif dengan `due_day == today.getDate()`, buat notifikasi `payment_due_today`; untuk Cicilan_CC gunakan pesan "Hari ini limit [nama akun] akan terpotong sebesar [jumlah] untuk cicilan [nama cicilan]"; untuk Cicilan_Non_CC gunakan pesan "Hari ini adalah hari pembayaran cicilan [nama cicilan] sebesar [jumlah] — jangan lupa bayar!"; gunakan dedup key `payment_due_today:{installmentId}:{YYYY-MM-DD}`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 13.2 Panggil fungsi notifikasi dari halaman `/commitments`
    - Pada saat halaman dimuat (setelah data tersedia), panggil `evaluateCommitmentAlerts` dan `evaluatePaymentDueToday`
    - _Requirements: 8.1, 8.4_

  - [ ]* 13.3 Tulis property test untuk deduplication notifikasi
    - **Property 10: Deduplication Notifikasi**
    - **Validates: Requirements 8.3, 8.7**

  - [ ]* 13.4 Tulis property test untuk pembuatan `commitment_alert`
    - **Property 11: Pembuatan Notifikasi commitment_alert**
    - **Validates: Requirements 8.1, 8.2**

- [x] 14. Update `NotificationPanel` untuk tipe notifikasi baru
  - [x] 14.1 Update `src/components/notifications/NotificationPanel.tsx`
    - Tambahkan ikon untuk tipe `payment_due_today` (contoh: 📅) dan `commitment_alert` (contoh: ⚠️) ke `TYPE_ICONS`
    - _Requirements: 8.4, 8.1_

- [ ] 15. Implementasi property-based tests untuk kalkulasi format IDR
  - [ ]* 15.1 Tulis property test untuk format IDR konsisten
    - Buat file `src/__tests__/properties/installment-idr-format.property.test.ts`
    - **Property 12: Format IDR Konsisten**
    - **Validates: Requirements 10.1**

  - [ ]* 15.2 Tulis property test untuk status awal pembayaran Non-CC
    - Buat file `src/__tests__/properties/installment-payment-status.property.test.ts`
    - **Property 5: Status Awal Pembayaran Non-CC**
    - **Validates: Requirements 1b.1**

  - [ ]* 15.3 Tulis property test untuk konfirmasi pembayaran Non-CC
    - **Property 6: Konfirmasi Pembayaran Non-CC**
    - **Validates: Requirements 1b.3**

- [x] 16. Final checkpoint — Pastikan semua tests pass, verifikasi RLS berfungsi (User A tidak bisa membaca data User B), tanyakan kepada user jika ada pertanyaan.

## Catatan

- Tasks yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Checkpoint memastikan validasi bertahap
- Property tests memvalidasi properti kebenaran universal dari design document
- Unit tests memvalidasi contoh spesifik dan edge cases
- Migrasi menggunakan nomor `00013` sebagai kelanjutan dari `00012_recurring_budget.sql`
- `installment_type` disimpan di DB meskipun bisa diturunkan dari tipe akun, untuk memudahkan query tanpa JOIN
- Log pembayaran dibuat secara lazy — hanya saat User membuka halaman Tracker atau mengkonfirmasi pembayaran
