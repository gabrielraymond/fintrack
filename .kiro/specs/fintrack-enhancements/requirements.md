# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk empat fitur baru pada aplikasi FinTrack: (1) Notifikasi & Reminder untuk peringatan anggaran, jatuh tempo kartu kredit, dan transaksi besar; (2) Dark/Light Mode Toggle untuk pergantian tema; (3) Rekening Tabungan/Dana Darurat sebagai sub-tipe akun baru dengan pelacakan target; dan (4) Privacy Mode untuk menyembunyikan semua nilai moneter di seluruh aplikasi. Fitur-fitur ini memperluas fungsionalitas FinTrack yang sudah ada (manajemen akun, transaksi, anggaran, dashboard) tanpa mengubah perilaku yang sudah berjalan.

## Glossary

- **FinTrack**: Aplikasi web keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu yang terautentikasi yang menggunakan FinTrack
- **Account**: Rekening keuangan milik User (bank, e-wallet, cash, credit_card, investment, tabungan, dana_darurat)
- **Transaction**: Catatan keuangan berupa pemasukan, pengeluaran, atau transfer
- **Budget**: Batas pengeluaran bulanan per kategori
- **Dashboard**: Halaman utama yang menampilkan ringkasan keuangan
- **Sidebar**: Panel navigasi desktop di sisi kiri layar
- **Bottom_Nav**: Bar navigasi mobile di bagian bawah layar
- **Header**: Area atas halaman yang berisi judul dan aksi cepat
- **Notification_Bell**: Ikon lonceng di Header/Sidebar yang menampilkan notifikasi in-app
- **Badge_Count**: Angka pada Notification_Bell yang menunjukkan jumlah notifikasi belum dibaca
- **Notification_Panel**: Panel dropdown/overlay yang menampilkan daftar notifikasi saat Notification_Bell diklik
- **Notification**: Pesan in-app yang dihasilkan oleh sistem untuk memberi tahu User tentang event tertentu
- **Budget_Alert**: Notifikasi yang dipicu ketika pengeluaran Budget mencapai threshold tertentu (75%, 90%, 100%)
- **Credit_Card_Reminder**: Notifikasi pengingat jatuh tempo kartu kredit
- **Large_Transaction_Alert**: Notifikasi yang dipicu ketika transaksi melebihi threshold yang ditentukan User
- **Theme_Provider**: React Context provider yang mengelola state tema (light/dark) di seluruh aplikasi
- **Theme_Preference**: Pilihan tema User yang disimpan secara persisten (light, dark, atau system)
- **System_Preference**: Preferensi tema dari sistem operasi User yang dideteksi via CSS media query `prefers-color-scheme`
- **Savings_Account**: Akun dengan sub-tipe "tabungan" untuk menyimpan dana tabungan
- **Emergency_Fund_Account**: Akun dengan sub-tipe "dana_darurat" untuk menyimpan dana darurat
- **Savings_Goal**: Target nominal yang ingin dicapai pada Savings_Account atau Emergency_Fund_Account
- **Savings_Progress**: Persentase pencapaian Savings_Goal berdasarkan saldo saat ini
- **Privacy_Mode**: Mode yang menyembunyikan semua nilai moneter di seluruh aplikasi
- **Privacy_Toggle**: Tombol ikon mata di Header/Sidebar untuk mengaktifkan/menonaktifkan Privacy_Mode
- **Masked_Value**: Teks pengganti (misalnya "Rp •••••••") yang ditampilkan menggantikan nilai moneter saat Privacy_Mode aktif
- **formatIDR**: Fungsi utilitas yang memformat angka ke format mata uang IDR
- **RLS**: Row Level Security pada Supabase/PostgreSQL untuk isolasi data per User
- **notifications Table**: Tabel database yang menyimpan Notification untuk setiap User
- **user_profiles Table**: Tabel database yang menyimpan profil dan preferensi User
- **localStorage**: Penyimpanan browser-side untuk preferensi yang tidak memerlukan sinkronisasi server

## Requirements

### Requirement 1: Notifikasi Anggaran (Budget Alert)

**User Story:** Sebagai User, saya ingin menerima notifikasi in-app ketika pengeluaran anggaran mendekati atau melebihi batas, sehingga saya dapat mengontrol pengeluaran sebelum terlambat.

#### Acceptance Criteria

1. WHEN pengeluaran pada suatu Budget mencapai 75% dari limit_amount, THE FinTrack SHALL membuat Budget_Alert dengan pesan yang menyebutkan nama kategori dan persentase penggunaan
2. WHEN pengeluaran pada suatu Budget mencapai 90% dari limit_amount, THE FinTrack SHALL membuat Budget_Alert dengan pesan peringatan yang menyebutkan nama kategori dan persentase penggunaan
3. WHEN pengeluaran pada suatu Budget mencapai atau melebihi 100% dari limit_amount, THE FinTrack SHALL membuat Budget_Alert dengan pesan bahwa anggaran telah terlampaui beserta nama kategori
4. THE FinTrack SHALL membuat satu Budget_Alert per threshold per Budget per bulan, tanpa duplikasi untuk threshold yang sama
5. WHEN sebuah Transaction expense dibuat atau diubah, THE FinTrack SHALL mengevaluasi ulang threshold Budget terkait dan membuat Budget_Alert baru jika threshold baru tercapai

### Requirement 2: Pengingat Jatuh Tempo Kartu Kredit (Credit Card Reminder)

**User Story:** Sebagai User, saya ingin menerima pengingat sebelum jatuh tempo kartu kredit, sehingga saya tidak terlambat membayar tagihan.

#### Acceptance Criteria

1. WHEN tanggal saat ini adalah 7 hari sebelum due_date kartu kredit, THE FinTrack SHALL membuat Credit_Card_Reminder dengan pesan yang menyebutkan nama kartu kredit dan tanggal jatuh tempo
2. WHEN tanggal saat ini adalah 3 hari sebelum due_date kartu kredit, THE FinTrack SHALL membuat Credit_Card_Reminder dengan pesan pengingat mendesak yang menyebutkan nama kartu kredit dan tanggal jatuh tempo
3. WHEN tanggal saat ini sama dengan due_date kartu kredit, THE FinTrack SHALL membuat Credit_Card_Reminder dengan pesan bahwa hari ini adalah jatuh tempo beserta nama kartu kredit
4. THE FinTrack SHALL membuat satu Credit_Card_Reminder per interval (7 hari, 3 hari, hari-H) per kartu kredit per siklus billing, tanpa duplikasi

### Requirement 3: Peringatan Transaksi Besar (Large Transaction Alert)

**User Story:** Sebagai User, saya ingin menerima notifikasi ketika transaksi besar tercatat, sehingga saya dapat memverifikasi transaksi tersebut dan mendeteksi kesalahan input.

#### Acceptance Criteria

1. WHEN sebuah Transaction dengan amount melebihi threshold yang ditentukan User dibuat, THE FinTrack SHALL membuat Large_Transaction_Alert dengan pesan yang menyebutkan jumlah transaksi, tipe, dan nama akun
2. THE FinTrack SHALL menyediakan pengaturan threshold transaksi besar pada halaman Settings dengan nilai default Rp 1.000.000
3. WHEN User mengubah threshold transaksi besar pada Settings, THE FinTrack SHALL menyimpan nilai baru dan menggunakannya untuk evaluasi transaksi berikutnya

### Requirement 4: Tampilan Notifikasi (Notification Display)

**User Story:** Sebagai User, saya ingin melihat semua notifikasi di satu tempat yang mudah diakses, sehingga saya tidak melewatkan informasi penting.

#### Acceptance Criteria

1. THE FinTrack SHALL menampilkan Notification_Bell pada Header di desktop dan pada area atas di mobile
2. WHILE terdapat Notification yang belum dibaca, THE Notification_Bell SHALL menampilkan Badge_Count dengan jumlah notifikasi belum dibaca
3. WHEN User mengklik Notification_Bell, THE FinTrack SHALL menampilkan Notification_Panel berisi daftar Notification diurutkan dari yang terbaru
4. WHEN User mengklik sebuah Notification pada Notification_Panel, THE FinTrack SHALL menandai Notification tersebut sebagai sudah dibaca dan mengurangi Badge_Count
5. THE Notification_Panel SHALL menampilkan setiap Notification dengan ikon tipe, pesan, dan waktu relatif (misalnya "2 jam lalu")
6. WHEN User mengklik tombol "Tandai semua dibaca" pada Notification_Panel, THE FinTrack SHALL menandai semua Notification sebagai sudah dibaca dan mengatur Badge_Count menjadi nol

### Requirement 5: Penyimpanan Notifikasi (Notification Persistence)

**User Story:** Sebagai User, saya ingin notifikasi tersimpan di database, sehingga saya dapat melihat riwayat notifikasi meskipun sudah menutup browser.

#### Acceptance Criteria

1. THE FinTrack SHALL menyimpan setiap Notification dalam notifications table dengan kolom: id, user_id, type, message, is_read, dan created_at
2. THE RLS SHALL memastikan setiap User hanya dapat membaca dan memperbarui Notification miliknya sendiri
3. WHEN User membuka aplikasi, THE FinTrack SHALL mengambil Notification yang belum dibaca dari database dan menampilkan Badge_Count yang sesuai

### Requirement 6: Dark/Light Mode Toggle

**User Story:** Sebagai User, saya ingin dapat beralih antara tema terang dan gelap, sehingga saya dapat menggunakan aplikasi dengan nyaman di berbagai kondisi pencahayaan.

#### Acceptance Criteria

1. THE FinTrack SHALL menyediakan toggle tema pada halaman Settings dan pada Sidebar (desktop) serta Bottom_Nav area (mobile)
2. THE FinTrack SHALL mendukung tiga opsi Theme_Preference: light, dark, dan system
3. WHEN User memilih Theme_Preference "system", THE FinTrack SHALL mendeteksi System_Preference menggunakan CSS media query `prefers-color-scheme` dan menerapkan tema yang sesuai
4. WHEN User memilih Theme_Preference "light", THE FinTrack SHALL menerapkan tema terang dengan warna yang sudah ada (emerald green primary, background #F0F4F3, surface #FFFFFF)
5. WHEN User memilih Theme_Preference "dark", THE FinTrack SHALL menerapkan tema gelap dengan background gelap, surface gelap, dan teks terang sambil mempertahankan primary color emerald green
6. THE FinTrack SHALL menyimpan Theme_Preference di localStorage untuk akses cepat dan di user_profiles table untuk sinkronisasi lintas perangkat
7. WHEN User membuka aplikasi tanpa Theme_Preference tersimpan, THE FinTrack SHALL menggunakan System_Preference sebagai default

### Requirement 7: Penerapan Tema (Theme Application)

**User Story:** Sebagai User, saya ingin perubahan tema langsung terlihat di seluruh aplikasi tanpa perlu refresh, sehingga pengalaman penggunaan tetap mulus.

#### Acceptance Criteria

1. WHEN User mengubah Theme_Preference, THE Theme_Provider SHALL menerapkan tema baru ke seluruh aplikasi secara instan tanpa page reload
2. THE FinTrack SHALL menerapkan tema menggunakan CSS variables pada elemen `<html>` sehingga semua komponen yang menggunakan design token Tailwind CSS otomatis berubah
3. THE FinTrack SHALL memastikan semua komponen UI (Card, Button, Modal, Sidebar, Bottom_Nav, Chart) menampilkan warna yang sesuai dengan tema aktif
4. WHILE tema dark aktif, THE FinTrack SHALL mempertahankan rasio kontras warna minimum 4.5:1 untuk semua teks terhadap background

### Requirement 8: Tipe Akun Tabungan dan Dana Darurat

**User Story:** Sebagai User, saya ingin membuat rekening tabungan dan dana darurat yang terpisah dari rekening biasa, sehingga saya dapat melacak progres menabung secara khusus.

#### Acceptance Criteria

1. THE FinTrack SHALL mendukung dua sub-tipe Account tambahan: "tabungan" (Savings_Account) dan "dana_darurat" (Emergency_Fund_Account)
2. WHEN User membuat Account baru, THE FinTrack SHALL menampilkan opsi tipe "Tabungan" dan "Dana Darurat" pada form pembuatan akun
3. WHEN User membuat Savings_Account atau Emergency_Fund_Account, THE FinTrack SHALL menyediakan field opsional untuk Savings_Goal (target nominal)
4. THE FinTrack SHALL menyimpan Savings_Goal pada kolom target_amount di tabel accounts

### Requirement 9: Tampilan Akun Tabungan Terpisah

**User Story:** Sebagai User, saya ingin rekening tabungan dan dana darurat ditampilkan terpisah dari rekening biasa, sehingga saya dapat dengan mudah membedakan dan memantau progres menabung.

#### Acceptance Criteria

1. WHEN User membuka halaman Accounts, THE FinTrack SHALL menampilkan Savings_Account dan Emergency_Fund_Account dalam section terpisah dengan judul "Tabungan & Dana Darurat"
2. WHEN sebuah Savings_Account atau Emergency_Fund_Account memiliki Savings_Goal, THE FinTrack SHALL menampilkan progress bar yang menunjukkan Savings_Progress (saldo saat ini / target_amount × 100%)
3. WHEN Savings_Progress mencapai atau melebihi 100%, THE FinTrack SHALL menampilkan indikator visual bahwa target telah tercapai
4. THE FinTrack SHALL menampilkan sisa nominal yang dibutuhkan untuk mencapai Savings_Goal (target_amount - saldo saat ini) pada setiap Savings_Account dan Emergency_Fund_Account yang memiliki target

### Requirement 10: Progres Tabungan di Dashboard

**User Story:** Sebagai User, saya ingin melihat ringkasan progres tabungan di dashboard, sehingga saya dapat memantau pencapaian target menabung secara cepat.

#### Acceptance Criteria

1. WHEN User membuka Dashboard, THE FinTrack SHALL menampilkan section "Progres Tabungan" yang berisi ringkasan semua Savings_Account dan Emergency_Fund_Account yang memiliki Savings_Goal
2. THE FinTrack SHALL menampilkan setiap akun tabungan dengan nama akun, saldo saat ini, target, dan progress bar
3. WHEN tidak ada Savings_Account atau Emergency_Fund_Account dengan Savings_Goal, THE FinTrack SHALL menyembunyikan section "Progres Tabungan" dari Dashboard

### Requirement 11: Transfer ke/dari Rekening Tabungan

**User Story:** Sebagai User, saya ingin melakukan transfer ke dan dari rekening tabungan, sehingga saya dapat menambah atau menarik dana tabungan dengan mudah.

#### Acceptance Criteria

1. WHEN User membuat transfer Transaction dengan Savings_Account atau Emergency_Fund_Account sebagai tujuan, THE FinTrack SHALL menambah saldo akun tujuan dan mengurangi saldo akun sumber secara atomik
2. WHEN User membuat transfer Transaction dari Savings_Account atau Emergency_Fund_Account, THE FinTrack SHALL mengurangi saldo akun sumber dan menambah saldo akun tujuan secara atomik
3. THE FinTrack SHALL menampilkan Savings_Account dan Emergency_Fund_Account pada daftar pilihan akun di Transaction_Modal untuk tipe transfer

### Requirement 12: Privacy Mode Toggle

**User Story:** Sebagai User, saya ingin dapat menyembunyikan semua nilai moneter di aplikasi dengan satu ketukan, sehingga orang di sekitar saya tidak dapat melihat informasi keuangan saya.

#### Acceptance Criteria

1. THE FinTrack SHALL menampilkan Privacy_Toggle (ikon mata) pada Header di desktop dan pada area atas di mobile untuk akses cepat
2. WHEN User mengklik Privacy_Toggle, THE FinTrack SHALL mengaktifkan Privacy_Mode dan mengubah ikon menjadi mata tertutup
3. WHEN User mengklik Privacy_Toggle saat Privacy_Mode aktif, THE FinTrack SHALL menonaktifkan Privacy_Mode dan mengubah ikon menjadi mata terbuka
4. THE FinTrack SHALL menyimpan state Privacy_Mode dalam session (React state atau sessionStorage) sehingga tetap aktif selama sesi browsing

### Requirement 13: Penyembunyian Nilai Moneter (Value Masking)

**User Story:** Sebagai User, saya ingin semua nilai moneter tersembunyi secara konsisten di seluruh aplikasi saat Privacy Mode aktif, sehingga tidak ada informasi keuangan yang terlihat.

#### Acceptance Criteria

1. WHILE Privacy_Mode aktif, THE FinTrack SHALL menampilkan Masked_Value "Rp •••••••" menggantikan semua output formatIDR di seluruh aplikasi
2. WHILE Privacy_Mode aktif, THE FinTrack SHALL menyembunyikan nilai pada: saldo akun, kekayaan bersih (Net Worth), jumlah transaksi, jumlah anggaran, jumlah pengeluaran anggaran, dan nilai pada chart
3. WHILE Privacy_Mode aktif, THE FinTrack SHALL menampilkan Masked_Value pada semua halaman: Dashboard, Transactions, Accounts, Budgets, dan Reports
4. WHILE Privacy_Mode aktif, THE FinTrack SHALL menyembunyikan data numerik pada chart Recharts (tooltip, label, axis values)

### Requirement 14: Reset Privacy Mode saat Logout

**User Story:** Sebagai User, saya ingin Privacy Mode otomatis nonaktif saat logout, sehingga sesi berikutnya dimulai dengan tampilan normal.

#### Acceptance Criteria

1. WHEN User melakukan logout, THE FinTrack SHALL menonaktifkan Privacy_Mode dan menghapus state Privacy_Mode dari session
2. WHEN User login kembali, THE FinTrack SHALL memulai dengan Privacy_Mode nonaktif (semua nilai moneter terlihat)
