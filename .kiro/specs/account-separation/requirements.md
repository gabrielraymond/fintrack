# Requirements Document

## Introduction

Fitur Pemisahan Akun menerapkan prinsip "bucket system" dalam keuangan pribadi ke FinTrack, dengan memisahkan akun yang aktif bertransaksi (operasional) dari akun yang uangnya "diparkir" untuk tujuan jangka menengah/panjang (simpanan & investasi). Pemisahan ini membantu pengguna melihat secara sekilas berapa uang yang bisa dibelanjakan versus berapa yang sudah diamankan. Fitur ini tidak mengubah skema database atau menambah tipe akun baru, melainkan mengklasifikasikan tipe akun yang sudah ada ke dalam dua kelompok dan memperbarui UI dashboard, halaman akun, dan modal transaksi sesuai klasifikasi tersebut.

## Glossary

- **FinTrack**: Aplikasi keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu terotentikasi yang menggunakan FinTrack
- **Account**: Entitas akun keuangan milik User (bank, e-wallet, cash, credit_card, investment, tabungan, dana_darurat)
- **AccountType**: Union type yang mendefinisikan jenis akun: `bank`, `e-wallet`, `cash`, `credit_card`, `investment`, `tabungan`, `dana_darurat`
- **Operational_Account**: Akun yang aktif bertransaksi sehari-hari, meliputi tipe `bank`, `e-wallet`, `cash`, dan `credit_card`
- **Savings_Account**: Akun yang uangnya "diparkir" untuk tujuan jangka menengah/panjang, meliputi tipe `tabungan`, `dana_darurat`, dan `investment`
- **Account_Classifier**: Utilitas terpusat yang mengklasifikasikan AccountType menjadi Operational_Account atau Savings_Account
- **NetWorthCard**: Komponen kartu di dashboard yang menampilkan kekayaan bersih User
- **AccountSummaryStrip**: Komponen horizontal scroll di dashboard yang menampilkan ringkasan saldo per akun
- **AccountStep**: Komponen pemilihan akun dalam modal transaksi
- **Accounts_Page**: Halaman daftar semua akun milik User
- **Dashboard**: Halaman utama FinTrack yang menampilkan ringkasan keuangan
- **Transaction**: Catatan keuangan berupa pemasukan (income), pengeluaran (expense), atau transfer
- **IDR**: Rupiah Indonesia, mata uang yang digunakan di seluruh FinTrack

## Requirements

### Requirement 1: Klasifikasi Tipe Akun Terpusat

**User Story:** Sebagai developer, saya ingin klasifikasi tipe akun operasional vs simpanan didefinisikan secara terpusat, sehingga logika pemisahan konsisten di seluruh aplikasi dan mudah diubah.

#### Acceptance Criteria

1. THE Account_Classifier SHALL mengklasifikasikan tipe `bank`, `e-wallet`, `cash`, dan `credit_card` sebagai Operational_Account
2. THE Account_Classifier SHALL mengklasifikasikan tipe `tabungan`, `dana_darurat`, dan `investment` sebagai Savings_Account
3. THE Account_Classifier SHALL menyediakan fungsi yang menerima AccountType dan mengembalikan klasifikasi akun tersebut (operasional atau simpanan)
4. THE Account_Classifier SHALL menyediakan fungsi yang menerima daftar Account dan mengembalikan dua daftar terpisah: Operational_Account dan Savings_Account
5. THE Account_Classifier SHALL menyediakan konstanta berisi daftar AccountType untuk masing-masing klasifikasi
6. WHEN AccountType baru ditambahkan di masa depan, THE Account_Classifier SHALL menjadi satu-satunya tempat yang perlu diperbarui untuk menentukan klasifikasinya

### Requirement 2: Pemisahan Net Worth di Dashboard

**User Story:** Sebagai User, saya ingin melihat kekayaan bersih saya dipecah menjadi saldo operasional dan saldo simpanan, sehingga saya dapat memahami berapa uang yang siap dipakai versus yang sudah diamankan.

#### Acceptance Criteria

1. WHEN Dashboard dimuat, THE NetWorthCard SHALL menampilkan tiga nilai: total kekayaan bersih (semua akun), saldo operasional (hanya Operational_Account), dan saldo simpanan & investasi (hanya Savings_Account)
2. THE NetWorthCard SHALL menampilkan total kekayaan bersih sebagai nilai utama yang paling menonjol
3. THE NetWorthCard SHALL menampilkan saldo operasional dan saldo simpanan & investasi sebagai nilai sekunder di bawah total kekayaan bersih
4. THE NetWorthCard SHALL menampilkan label "Kekayaan Bersih" untuk total, "Saldo Operasional" untuk Operational_Account, dan "Simpanan & Investasi" untuk Savings_Account
5. THE NetWorthCard SHALL menampilkan semua nilai moneter dalam format IDR
6. WHEN saldo bernilai negatif, THE NetWorthCard SHALL menampilkan nilai tersebut dengan warna merah (danger)
7. THE NetWorthCard SHALL menghitung saldo menggunakan Account_Classifier untuk memisahkan akun

### Requirement 3: Pemisahan AccountSummaryStrip di Dashboard

**User Story:** Sebagai User, saya ingin melihat ringkasan akun di dashboard dipisahkan antara akun operasional dan akun simpanan, sehingga saya dapat melihat saldo masing-masing kelompok secara terpisah.

#### Acceptance Criteria

1. WHEN Dashboard dimuat, THE Dashboard SHALL menampilkan dua AccountSummaryStrip terpisah: satu untuk Operational_Account dan satu untuk Savings_Account
2. THE AccountSummaryStrip untuk Operational_Account SHALL menampilkan label bagian "Akun Operasional"
3. THE AccountSummaryStrip untuk Savings_Account SHALL menampilkan label bagian "Simpanan & Investasi"
4. WHEN User tidak memiliki Operational_Account aktif, THE Dashboard SHALL menyembunyikan AccountSummaryStrip untuk Operational_Account
5. WHEN User tidak memiliki Savings_Account aktif, THE Dashboard SHALL menyembunyikan AccountSummaryStrip untuk Savings_Account
6. THE Dashboard SHALL menggunakan Account_Classifier untuk memisahkan akun ke dalam masing-masing strip

### Requirement 4: Filter Akun pada Modal Transaksi

**User Story:** Sebagai User, saya ingin hanya melihat akun operasional saat mencatat pengeluaran atau pemasukan, sehingga saya tidak salah memilih akun simpanan untuk transaksi harian.

#### Acceptance Criteria

1. WHEN tipe transaksi adalah expense atau income, THE AccountStep SHALL hanya menampilkan Operational_Account pada daftar pemilihan akun sumber
2. WHEN tipe transaksi adalah transfer, THE AccountStep SHALL menampilkan semua Account (Operational_Account dan Savings_Account) pada daftar pemilihan akun sumber dan akun tujuan
3. THE AccountStep SHALL menggunakan Account_Classifier untuk menentukan akun mana yang ditampilkan
4. WHEN User tidak memiliki Operational_Account aktif dan tipe transaksi adalah expense atau income, THE AccountStep SHALL menampilkan pesan bahwa tidak ada akun operasional tersedia
5. THE AccountStep SHALL tetap menampilkan saldo setiap akun dalam format IDR pada daftar pemilihan

### Requirement 5: Pembaruan Halaman Akun

**User Story:** Sebagai User, saya ingin akun investasi dikelompokkan bersama tabungan dan dana darurat di halaman akun, sehingga pengelompokan konsisten dengan prinsip bucket system.

#### Acceptance Criteria

1. THE Accounts_Page SHALL menampilkan Operational_Account dalam bagian pertama tanpa label bagian khusus (perilaku saat ini untuk akun reguler)
2. THE Accounts_Page SHALL menampilkan Savings_Account (tabungan, dana_darurat, dan investment) dalam bagian terpisah dengan label "Tabungan, Investasi & Dana Darurat"
3. THE Accounts_Page SHALL menggunakan Account_Classifier untuk menentukan pengelompokan akun
4. WHEN User tidak memiliki Savings_Account, THE Accounts_Page SHALL menyembunyikan bagian "Tabungan, Investasi & Dana Darurat"
5. WHEN User tidak memiliki Operational_Account, THE Accounts_Page SHALL menyembunyikan bagian akun operasional

### Requirement 6: Konsistensi Perhitungan Net Worth

**User Story:** Sebagai User, saya ingin total kekayaan bersih selalu sama dengan jumlah saldo operasional ditambah saldo simpanan, sehingga saya yakin angka-angka yang ditampilkan akurat dan konsisten.

#### Acceptance Criteria

1. THE FinTrack SHALL memastikan bahwa total kekayaan bersih selalu sama dengan penjumlahan saldo operasional dan saldo simpanan & investasi
2. THE FinTrack SHALL menghitung saldo operasional sebagai jumlah balance dari semua Operational_Account yang tidak di-soft-delete
3. THE FinTrack SHALL menghitung saldo simpanan & investasi sebagai jumlah balance dari semua Savings_Account yang tidak di-soft-delete
4. THE FinTrack SHALL mengecualikan Account yang telah di-soft-delete dari semua perhitungan saldo
