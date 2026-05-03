# Requirements Document

## Introduction

Fitur Recurring Budget memungkinkan pengguna FinTrack menandai anggaran sebagai "berulang" (recurring), sehingga saat periode anggaran baru dimulai, anggaran tersebut otomatis dibawa ke bulan berikutnya. Nominal anggaran mengikuti bulan terakhir yang aktif, dan jika pengguna mengedit nominal, maka nominal baru yang digunakan untuk bulan-bulan selanjutnya. Anggaran yang tidak ditandai berulang tidak akan di-carry over.

## Glossary

- **FinTrack**: Aplikasi keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu terotentikasi yang menggunakan FinTrack
- **Budget**: Entitas anggaran per kategori per bulan dengan field `month` (DATE) dan `limit_amount`
- **Recurring_Budget**: Budget yang memiliki flag `is_recurring` bernilai true, sehingga otomatis dibuat ulang di periode berikutnya
- **Budget_Period**: Periode anggaran bulanan yang ditentukan oleh Cutoff_Date pengguna (lihat fitur Custom Cutoff Date)
- **Carry_Over**: Proses pembuatan Budget baru di periode berikutnya berdasarkan Budget recurring di periode sebelumnya
- **Last_Amount**: Nilai `limit_amount` dari Budget recurring di bulan terakhir yang aktif, yang menjadi dasar nominal untuk bulan berikutnya
- **BudgetForm**: Komponen formulir untuk membuat dan mengedit anggaran
- **IDR**: Rupiah Indonesia, mata uang yang digunakan di seluruh FinTrack

## Requirements

### Requirement 1: Penyimpanan Flag Recurring di Database

**User Story:** Sebagai User, saya ingin anggaran saya memiliki penanda apakah berulang atau tidak, sehingga sistem tahu anggaran mana yang perlu dibuat ulang di bulan berikutnya.

#### Acceptance Criteria

1. THE Budget SHALL menyimpan field `is_recurring` bertipe BOOLEAN dengan nilai default FALSE
2. WHEN Budget baru dibuat tanpa menyebutkan `is_recurring`, THE FinTrack SHALL menetapkan nilai FALSE sehingga perilaku default tidak berubah dari sebelumnya
3. THE FinTrack SHALL mempertahankan semua field Budget yang sudah ada tanpa perubahan selain penambahan `is_recurring`

### Requirement 2: Toggle Recurring pada Formulir Anggaran

**User Story:** Sebagai User, saya ingin menandai anggaran sebagai berulang saat membuat atau mengedit anggaran, sehingga saya tidak perlu membuat anggaran yang sama setiap bulan secara manual.

#### Acceptance Criteria

1. THE BudgetForm SHALL menampilkan checkbox atau toggle berlabel "Anggaran Berulang" yang memungkinkan User mengaktifkan atau menonaktifkan flag recurring
2. WHEN User membuat Budget baru dengan toggle recurring aktif, THE FinTrack SHALL menyimpan Budget dengan `is_recurring` bernilai TRUE
3. WHEN User mengedit Budget yang sudah ada, THE BudgetForm SHALL menampilkan status `is_recurring` saat ini dan memungkinkan perubahan
4. WHEN User menonaktifkan toggle recurring pada Budget yang sebelumnya recurring, THE FinTrack SHALL memperbarui `is_recurring` menjadi FALSE dan menghentikan carry over di bulan berikutnya

### Requirement 3: Carry Over Otomatis Budget Recurring

**User Story:** Sebagai User, saya ingin anggaran berulang otomatis muncul di bulan berikutnya, sehingga saya tidak perlu membuat ulang anggaran yang sama setiap bulan.

#### Acceptance Criteria

1. WHEN Budget_Period baru dimulai dan User mengakses halaman anggaran, THE FinTrack SHALL secara otomatis membuat Budget baru untuk setiap Recurring_Budget dari periode sebelumnya yang belum memiliki Budget di periode baru
2. WHEN melakukan Carry_Over, THE FinTrack SHALL menggunakan Last_Amount dari Budget recurring di bulan terakhir sebagai `limit_amount` untuk Budget baru
3. WHEN melakukan Carry_Over, THE FinTrack SHALL menyalin `category_id` dan `is_recurring` bernilai TRUE dari Budget sumber ke Budget baru
4. WHEN Budget untuk kategori dan bulan yang sama sudah ada di periode baru, THE FinTrack SHALL melewatkan Carry_Over untuk kategori tersebut tanpa menimbulkan error
5. THE FinTrack SHALL hanya melakukan Carry_Over untuk Budget dengan `is_recurring` bernilai TRUE

### Requirement 4: Nominal Mengikuti Bulan Terakhir

**User Story:** Sebagai User, saya ingin nominal anggaran berulang mengikuti bulan terakhir, sehingga perubahan nominal yang saya buat tetap berlaku di bulan-bulan selanjutnya.

#### Acceptance Criteria

1. WHEN melakukan Carry_Over, THE FinTrack SHALL mengambil `limit_amount` dari Budget recurring dengan bulan paling akhir untuk kategori yang sama milik User tersebut
2. WHEN User mengedit `limit_amount` pada Budget recurring di bulan berjalan, THE FinTrack SHALL menggunakan nominal baru tersebut sebagai Last_Amount untuk Carry_Over bulan berikutnya
3. THE FinTrack SHALL menentukan Last_Amount berdasarkan Budget dengan field `month` terbesar untuk kombinasi `user_id`, `category_id`, dan `is_recurring` TRUE

### Requirement 5: Anggaran Non-Recurring Tidak Di-Carry Over

**User Story:** Sebagai User, saya ingin anggaran yang tidak ditandai berulang hanya berlaku untuk bulan tersebut, sehingga saya memiliki kontrol penuh atas anggaran mana yang muncul di bulan berikutnya.

#### Acceptance Criteria

1. WHEN Budget_Period baru dimulai, THE FinTrack SHALL mengabaikan semua Budget dengan `is_recurring` bernilai FALSE dalam proses Carry_Over
2. WHEN User membuat Budget baru tanpa mengaktifkan toggle recurring, THE Budget SHALL memiliki `is_recurring` FALSE dan tidak akan di-carry over ke bulan berikutnya
