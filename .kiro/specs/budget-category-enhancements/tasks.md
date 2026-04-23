# Rencana Implementasi: Budget Category Enhancements

## Ikhtisar

Implementasi dua peningkatan fitur: (1) form tambah kategori kustom di halaman pengaturan, dan (2) kemampuan edit bulan pada anggaran. Semua perubahan memanfaatkan hook dan komponen yang sudah ada.

## Tasks

- [x] 1. Buat komponen CategoryForm dan integrasikan ke halaman pengaturan
  - [x] 1.1 Buat komponen `src/components/categories/CategoryForm.tsx`
    - Modal form dengan field nama (text input) dan ikon (text input)
    - Validasi: nama tidak boleh kosong atau hanya spasi (trim lalu cek panjang > 0)
    - Validasi: ikon tidak boleh kosong
    - Gunakan komponen `Modal` dan `Button` yang sudah ada
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Tambahkan tombol "Tambah Kategori" dan integrasi CategoryForm di `CategorySection` pada `src/app/(protected)/settings/page.tsx`
    - Tambahkan state `formOpen` dan integrasi `useCreateCategory`
    - Tombol "Tambah Kategori" di atas daftar kategori
    - Saat submit berhasil, tutup form dan refresh daftar
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 1.3 Tulis property test untuk pembuatan kategori kustom
    - **Property 1: Kategori kustom selalu non-default**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 1.4 Tulis property test untuk validasi nama kategori
    - **Property 2: Nama kategori hanya-spasi selalu ditolak**
    - **Validates: Requirements 1.3**

- [x] 2. Checkpoint - Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan ke pengguna jika ada pertanyaan.

- [x] 3. Aktifkan edit bulan pada formulir anggaran
  - [x] 3.1 Modifikasi `useUpdateBudget` di `src/hooks/useBudgets.ts`
    - Perluas parameter mutation untuk menerima field `month` opsional
    - Tambahkan `month` ke objek update jika disediakan
    - Tambahkan penanganan error kode 23505 dengan pesan spesifik duplikasi
    - _Requirements: 2.2, 2.3, 2.5_

  - [x] 3.2 Modifikasi `BudgetForm` di `src/components/budgets/BudgetForm.tsx`
    - Hapus `disabled={isEdit}` pada input bulan
    - Field bulan selalu dapat diedit di mode create maupun edit
    - _Requirements: 2.1_

  - [x] 3.3 Modifikasi `handleEdit` di `src/app/(protected)/budgets/page.tsx`
    - Kirim `data.month` ke `updateBudget.mutate` selain `limit_amount`
    - _Requirements: 2.2_

  - [ ]* 3.4 Tulis property test untuk pembaruan bulan anggaran
    - **Property 3: Pembaruan bulan anggaran tersimpan dengan benar**
    - **Validates: Requirements 2.2**

  - [ ]* 3.5 Tulis property test untuk duplikasi anggaran
    - **Property 4: Duplikasi anggaran kategori-bulan selalu ditolak**
    - **Validates: Requirements 2.3**

  - [ ]* 3.6 Tulis property test untuk konsistensi pengeluaran
    - **Property 5: Pengeluaran anggaran konsisten dengan transaksi bulan terkait**
    - **Validates: Requirements 2.4**

- [x] 4. Checkpoint akhir - Pastikan semua test lulus
  - Pastikan semua test lulus, tanyakan ke pengguna jika ada pertanyaan.

## Catatan

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Setiap task mereferensikan persyaratan spesifik untuk traceability
- Property test menggunakan fast-check dengan minimum 100 iterasi
- Tidak ada perubahan skema database yang diperlukan
