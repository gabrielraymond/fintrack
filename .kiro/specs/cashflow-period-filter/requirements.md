# Requirements Document

## Introduction

Fitur Cashflow Period Filter memperbaiki tampilan Arus Kas (Cash Flow) di dashboard FinTrack yang saat ini tidak memiliki filter periode dan membingungkan pengguna. Perbaikan ini menambahkan navigasi periode berbasis cutoff date (sama seperti yang sudah ada di halaman anggaran dan laporan), sehingga data arus kas ditampilkan per siklus anggaran (cutoff ke cutoff), bukan hanya bulan kalender. Selain itu, tampilan chart akan diperjelas agar lebih mudah dipahami.

## Glossary

- **FinTrack**: Aplikasi keuangan pribadi yang sedang dikembangkan
- **User**: Individu terotentikasi yang menggunakan FinTrack
- **CashFlowChart**: Komponen dashboard yang menampilkan grafik batang pemasukan dan pengeluaran harian
- **Cutoff_Date**: Angka integer 1-28 yang menentukan tanggal mulai siklus anggaran pengguna
- **Budget_Cycle**: Periode anggaran dari Cutoff_Date di satu bulan hingga sehari sebelum Cutoff_Date di bulan berikutnya
- **Cycle_Range**: Pasangan tanggal `{ start: string, end: string }` yang merepresentasikan awal dan akhir sebuah Budget_Cycle
- **CashFlowPeriodSelector**: Komponen navigasi periode untuk berpindah antar siklus anggaran pada tampilan arus kas
- **CashFlowSummary**: Ringkasan total pemasukan, pengeluaran, dan selisih bersih dalam satu periode arus kas
- **getCycleRange**: Fungsi utilitas terpusat yang menghitung Cycle_Range berdasarkan Cutoff_Date dan Reference_Date
- **getCycleRangeForMonth**: Fungsi utilitas yang menghitung Cycle_Range untuk bulan anggaran tertentu

## Requirements

### Requirement 1: Navigasi Periode pada Arus Kas

**User Story:** Sebagai User, saya ingin bisa berpindah antar periode pada tampilan arus kas, sehingga saya dapat melihat data arus kas per siklus anggaran (bukan hanya bulan berjalan).

#### Acceptance Criteria

1. THE CashFlowChart SHALL menampilkan CashFlowPeriodSelector yang memungkinkan User berpindah ke periode sebelumnya dan periode berikutnya
2. WHEN halaman dashboard dimuat, THE CashFlowPeriodSelector SHALL menampilkan periode siklus berjalan berdasarkan Cutoff_Date pengguna
3. WHEN User menekan tombol periode sebelumnya, THE CashFlowPeriodSelector SHALL berpindah ke siklus anggaran sebelumnya dan memuat data transaksi periode tersebut
4. WHEN User menekan tombol periode berikutnya, THE CashFlowPeriodSelector SHALL berpindah ke siklus anggaran berikutnya dan memuat data transaksi periode tersebut
5. WHILE periode yang ditampilkan adalah periode berjalan atau masa depan, THE CashFlowPeriodSelector SHALL menonaktifkan tombol navigasi berikutnya
6. THE CashFlowPeriodSelector SHALL menampilkan label periode dalam format rentang tanggal yang mudah dibaca (contoh: "25 Jan – 24 Feb")
7. WHEN Cutoff_Date bernilai 1, THE CashFlowPeriodSelector SHALL menampilkan label bulan kalender standar (contoh: "Januari 2024")

### Requirement 2: Filter Data Arus Kas Berdasarkan Periode

**User Story:** Sebagai User, saya ingin data arus kas difilter sesuai periode siklus anggaran yang dipilih, sehingga grafik menampilkan data yang relevan dengan periode gaji saya.

#### Acceptance Criteria

1. WHEN periode dipilih, THE CashFlowChart SHALL memfilter transaksi dengan `date >= cycle_start` dan `date < cycle_end` dari Cycle_Range yang sesuai
2. WHEN Cutoff_Date bernilai 1, THE CashFlowChart SHALL menampilkan data yang identik dengan logika bulan kalender sebelumnya
3. WHEN periode berubah, THE CashFlowChart SHALL memuat ulang data transaksi sesuai Cycle_Range periode baru
4. THE CashFlowChart SHALL menampilkan semua hari dalam rentang periode yang memiliki transaksi, termasuk hari-hari yang melewati batas bulan kalender

### Requirement 3: Tampilan Ringkasan Arus Kas per Periode

**User Story:** Sebagai User, saya ingin melihat ringkasan total pemasukan, pengeluaran, dan selisih bersih di setiap periode arus kas, sehingga saya dapat memahami kondisi keuangan per siklus dengan cepat.

#### Acceptance Criteria

1. THE CashFlowChart SHALL menampilkan CashFlowSummary yang berisi total pemasukan, total pengeluaran, dan selisih bersih untuk periode yang dipilih
2. WHEN selisih bersih positif, THE CashFlowSummary SHALL menampilkan nilai dengan indikator visual positif (warna hijau)
3. WHEN selisih bersih negatif, THE CashFlowSummary SHALL menampilkan nilai dengan indikator visual negatif (warna merah)
4. WHEN data transaksi berubah karena perpindahan periode, THE CashFlowSummary SHALL memperbarui nilai ringkasan sesuai data periode baru

### Requirement 4: Perbaikan Tampilan Grafik Arus Kas

**User Story:** Sebagai User, saya ingin grafik arus kas lebih jelas dan mudah dipahami, sehingga saya dapat menganalisis pola pemasukan dan pengeluaran dengan lebih baik.

#### Acceptance Criteria

1. THE CashFlowChart SHALL menampilkan label sumbu-X dengan format tanggal yang jelas (tanggal dalam bulan, bukan hanya angka hari)
2. WHEN periode melewati batas bulan kalender (contoh: 25 Jan – 24 Feb), THE CashFlowChart SHALL menampilkan label tanggal yang menyertakan informasi bulan pada titik pergantian bulan
3. THE CashFlowChart SHALL menampilkan tooltip yang berisi tanggal lengkap, jumlah pemasukan, dan jumlah pengeluaran dalam format Rupiah
4. WHEN tidak ada transaksi dalam periode yang dipilih, THE CashFlowChart SHALL menampilkan pesan kosong yang informatif dengan menyebutkan rentang periode

### Requirement 5: Konsistensi dengan Komponen Lain

**User Story:** Sebagai User, saya ingin navigasi periode arus kas konsisten dengan navigasi periode di anggaran dan laporan, sehingga pengalaman penggunaan aplikasi seragam.

#### Acceptance Criteria

1. THE CashFlowPeriodSelector SHALL menggunakan getCycleRange dan getCycleRangeForMonth dari cycle-utils untuk perhitungan periode
2. THE CashFlowChart SHALL menggunakan Cutoff_Date yang sama dari useCutoffDate hook yang digunakan komponen lain
3. WHEN Cutoff_Date pengguna berubah di pengaturan, THE CashFlowChart SHALL merefleksikan perubahan tersebut pada kunjungan berikutnya tanpa perlu tindakan tambahan dari User

