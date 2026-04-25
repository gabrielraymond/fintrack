# Requirements Document

## Introduction

Fitur Custom Cutoff Date memungkinkan setiap pengguna FinTrack mengatur tanggal cutoff (tanggal gajian) sendiri, sehingga siklus anggaran, ringkasan bulanan, dan laporan mengikuti periode gaji pengguna, bukan bulan kalender standar 1-31. Ini menerapkan prinsip "pay period budgeting" — menyelaraskan siklus anggaran dengan siklus pendapatan. Teknik ini mengurangi beban kognitif karena pengguna berpikir tentang uang dalam konteks "gaji ini" bukan "bulan kalender ini." Fitur ini sangat berguna di Indonesia di mana banyak pekerja menerima gaji pada tanggal 25.

## Glossary

- **FinTrack**: Aplikasi keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu terotentikasi yang menggunakan FinTrack
- **Cutoff_Date**: Angka integer 1-28 yang menentukan tanggal mulai siklus anggaran pengguna. Nilai 1 berarti siklus mengikuti bulan kalender standar (1-31). Dibatasi 1-28 untuk menghindari masalah bulan yang memiliki kurang dari 31 hari
- **Budget_Cycle**: Periode anggaran yang dimulai dari Cutoff_Date di satu bulan hingga sehari sebelum Cutoff_Date di bulan berikutnya. Contoh: jika Cutoff_Date = 25, siklus adalah tanggal 25 Jan - 24 Feb
- **Cycle_Range**: Pasangan tanggal `{ start: string, end: string }` yang merepresentasikan awal dan akhir sebuah Budget_Cycle
- **Reference_Date**: Tanggal acuan untuk menentukan Budget_Cycle mana yang sedang aktif. Default-nya adalah hari ini
- **getCycleRange**: Fungsi utilitas terpusat yang menghitung Cycle_Range berdasarkan Cutoff_Date dan Reference_Date
- **UserProfile**: Tabel database yang menyimpan preferensi pengguna termasuk Cutoff_Date
- **Budget**: Entitas anggaran per kategori per bulan. Field `month` (DATE) merepresentasikan bulan di mana siklus dimulai
- **MonthlySummaryCard**: Komponen dashboard yang menampilkan ringkasan pemasukan/pengeluaran periode berjalan
- **BudgetProgressSection**: Komponen dashboard yang menampilkan progress anggaran periode berjalan
- **Settings_Page**: Halaman pengaturan di mana User mengonfigurasi preferensi
- **IDR**: Rupiah Indonesia, mata uang yang digunakan di seluruh FinTrack

## Requirements

### Requirement 1: Penyimpanan Cutoff Date di Database

**User Story:** Sebagai User, saya ingin tanggal cutoff saya tersimpan di profil, sehingga preferensi saya persisten dan digunakan di seluruh aplikasi.

#### Acceptance Criteria

1. THE UserProfile SHALL menyimpan field `cutoff_date` bertipe INTEGER dengan nilai default 1
2. THE UserProfile SHALL membatasi nilai `cutoff_date` dalam rentang 1 sampai 28
3. WHEN User baru mendaftar, THE FinTrack SHALL menetapkan `cutoff_date` bernilai 1 sehingga perilaku default identik dengan bulan kalender standar

### Requirement 2: Pengaturan Cutoff Date di Settings

**User Story:** Sebagai User, saya ingin mengatur tanggal cutoff/gajian di halaman pengaturan, sehingga saya dapat menyesuaikan siklus anggaran dengan periode gaji saya.

#### Acceptance Criteria

1. THE Settings_Page SHALL menampilkan pengaturan "Tanggal Cutoff / Gajian" yang memungkinkan User memilih angka 1 sampai 28
2. WHEN User mengubah nilai Cutoff_Date dan menyimpan, THE FinTrack SHALL memperbarui field `cutoff_date` di UserProfile
3. WHEN perubahan Cutoff_Date berhasil disimpan, THE FinTrack SHALL menampilkan notifikasi sukses
4. IF penyimpanan Cutoff_Date gagal, THEN THE FinTrack SHALL menampilkan pesan error dan mempertahankan nilai sebelumnya
5. THE Settings_Page SHALL menampilkan penjelasan singkat bahwa cutoff date menentukan awal siklus anggaran bulanan

### Requirement 3: Utilitas Perhitungan Cycle Range Terpusat

**User Story:** Sebagai developer, saya ingin perhitungan rentang siklus anggaran didefinisikan secara terpusat, sehingga logika konsisten di seluruh aplikasi dan mudah diuji.

#### Acceptance Criteria

1. THE getCycleRange SHALL menerima parameter Cutoff_Date (integer 1-28) dan Reference_Date opsional (default: hari ini), lalu mengembalikan Cycle_Range berupa `{ start: string, end: string }` dalam format `YYYY-MM-DD`
2. WHEN Cutoff_Date bernilai 1, THE getCycleRange SHALL mengembalikan rentang bulan kalender standar (tanggal 1 bulan berjalan sampai tanggal 1 bulan berikutnya)
3. WHEN Cutoff_Date bernilai lebih dari 1 dan Reference_Date sama dengan atau setelah Cutoff_Date di bulan berjalan, THE getCycleRange SHALL mengembalikan rentang dari Cutoff_Date bulan berjalan sampai Cutoff_Date bulan berikutnya
4. WHEN Cutoff_Date bernilai lebih dari 1 dan Reference_Date sebelum Cutoff_Date di bulan berjalan, THE getCycleRange SHALL mengembalikan rentang dari Cutoff_Date bulan sebelumnya sampai Cutoff_Date bulan berjalan
5. THE getCycleRange SHALL menghasilkan Cycle_Range di mana `start` selalu lebih kecil dari `end`
6. FOR ALL Cutoff_Date dan Reference_Date yang valid, parsing lalu formatting Cycle_Range SHALL menghasilkan string tanggal yang valid dalam format `YYYY-MM-DD`

### Requirement 4: Hook untuk Mengakses Cutoff Date

**User Story:** Sebagai developer, saya ingin hook React yang menyediakan cutoff date pengguna, sehingga komponen dapat mengakses preferensi ini secara konsisten.

#### Acceptance Criteria

1. THE useCutoffDate hook SHALL mengambil nilai `cutoff_date` dari UserProfile pengguna yang sedang login
2. WHEN data profil sedang dimuat, THE useCutoffDate hook SHALL mengembalikan status loading
3. WHEN profil tidak memiliki `cutoff_date` atau nilainya null, THE useCutoffDate hook SHALL mengembalikan nilai default 1
4. WHEN `cutoff_date` di profil berubah, THE useCutoffDate hook SHALL merefleksikan nilai terbaru

### Requirement 5: Integrasi Cutoff Date pada Perhitungan Anggaran

**User Story:** Sebagai User, saya ingin pengeluaran anggaran dihitung berdasarkan siklus cutoff saya, sehingga progress anggaran mencerminkan periode gaji saya.

#### Acceptance Criteria

1. WHEN menghitung pengeluaran untuk sebuah Budget, THE useBudgets hook SHALL menggunakan Cycle_Range dari getCycleRange berdasarkan Cutoff_Date pengguna, bukan rentang bulan kalender
2. WHEN Cutoff_Date bernilai 1, THE useBudgets hook SHALL menghasilkan perhitungan yang identik dengan logika bulan kalender sebelumnya
3. THE useBudgets hook SHALL memfilter transaksi expense dengan `date >= cycle_start` dan `date < cycle_end`

### Requirement 6: Integrasi Cutoff Date pada Ringkasan Bulanan Dashboard

**User Story:** Sebagai User, saya ingin ringkasan bulanan di dashboard mengikuti siklus cutoff saya, sehingga saya melihat pemasukan dan pengeluaran dalam konteks periode gaji.

#### Acceptance Criteria

1. WHEN menampilkan ringkasan bulan berjalan, THE MonthlySummaryCard SHALL menggunakan Cycle_Range dari getCycleRange berdasarkan Cutoff_Date pengguna
2. WHEN Cutoff_Date bernilai 1, THE MonthlySummaryCard SHALL menghasilkan ringkasan yang identik dengan logika bulan kalender sebelumnya
3. THE MonthlySummaryCard SHALL memfilter transaksi dengan `date >= cycle_start` dan `date < cycle_end`

### Requirement 7: Integrasi Cutoff Date pada Budget Progress Dashboard

**User Story:** Sebagai User, saya ingin progress anggaran di dashboard mengikuti siklus cutoff saya, sehingga saya melihat sisa anggaran yang relevan dengan periode gaji berjalan.

#### Acceptance Criteria

1. WHEN menentukan periode berjalan, THE BudgetProgressSection SHALL menggunakan getCycleRange berdasarkan Cutoff_Date pengguna untuk menentukan bulan anggaran aktif
2. WHEN Cutoff_Date bernilai 1, THE BudgetProgressSection SHALL menampilkan anggaran yang identik dengan logika bulan kalender sebelumnya

### Requirement 8: Integrasi Cutoff Date pada Laporan

**User Story:** Sebagai User, saya ingin laporan keuangan mengikuti siklus cutoff saya, sehingga analisis keuangan mencerminkan periode gaji.

#### Acceptance Criteria

1. WHEN menghitung rentang tanggal untuk laporan bulanan, THE useReports hook SHALL menggunakan getCycleRange berdasarkan Cutoff_Date pengguna
2. WHEN menghitung rentang tanggal untuk tren 6 bulan, THE useReports hook SHALL menggunakan getCycleRange untuk setiap bulan dalam rentang tren
3. WHEN menghitung rentang tanggal untuk perbandingan month-over-month, THE useReports hook SHALL menggunakan getCycleRange untuk bulan berjalan dan bulan sebelumnya
4. WHEN Cutoff_Date bernilai 1, THE useReports hook SHALL menghasilkan rentang tanggal yang identik dengan logika bulan kalender sebelumnya

### Requirement 9: Kompatibilitas Mundur dan Interpretasi Budget Month

**User Story:** Sebagai User yang sudah ada, saya ingin aplikasi tetap berfungsi sama jika saya tidak mengubah cutoff date, sehingga tidak ada perubahan perilaku yang tidak diinginkan.

#### Acceptance Criteria

1. WHEN Cutoff_Date bernilai 1 (default), THE FinTrack SHALL berperilaku identik dengan logika bulan kalender sebelumnya di semua komponen
2. THE FinTrack SHALL menginterpretasikan field `month` pada Budget sebagai bulan di mana Budget_Cycle dimulai. Contoh: jika Cutoff_Date = 25, budget dengan month "2024-01-01" merepresentasikan siklus 25 Jan - 24 Feb
3. THE FinTrack SHALL mempertahankan skema tabel Budget tanpa perubahan (field `month` tetap bertipe DATE)
4. THE FinTrack SHALL mempertahankan skema tabel Transaction tanpa perubahan
