# Requirements Document

## Introduction

Fitur Laporan Bulanan/Tahunan menambahkan halaman analitik komprehensif ke FinTrack yang memungkinkan pengguna memvisualisasikan dan menganalisis data keuangan mereka dalam periode bulanan dan tahunan. Fitur ini mencakup pie chart pengeluaran per kategori, grafik tren pemasukan vs pengeluaran lintas bulan, perbandingan bulan-ke-bulan (month-over-month), dan ringkasan tahunan. Semua teks UI ditampilkan dalam Bahasa Indonesia, dan semua nilai moneter menggunakan format IDR. Fitur ini memanfaatkan data transaksi, kategori, dan akun yang sudah ada di FinTrack, serta menggunakan Recharts untuk visualisasi.

## Glossary

- **Reports_Page**: Halaman analitik/laporan yang menampilkan visualisasi data keuangan bulanan dan tahunan
- **Period_Selector**: Komponen UI yang memungkinkan pengguna memilih bulan dan tahun untuk ditampilkan di laporan
- **Expense_Pie_Chart**: Pie chart (Recharts) yang menampilkan distribusi pengeluaran berdasarkan Category untuk periode yang dipilih
- **Income_Expense_Trend_Chart**: Grafik batang atau garis (Recharts) yang menampilkan tren pemasukan dan pengeluaran lintas beberapa bulan
- **Month_Over_Month_Comparison**: Tampilan perbandingan metrik keuangan antara bulan yang dipilih dan bulan sebelumnya
- **Yearly_Summary_View**: Tampilan ringkasan tahunan yang mengagregasi data keuangan selama 12 bulan dalam satu tahun kalender
- **Report_Summary_Card**: Kartu ringkasan yang menampilkan total pemasukan, total pengeluaran, dan selisih bersih untuk periode yang dipilih
- **Category_Breakdown**: Rincian pengeluaran per Category yang ditampilkan sebagai daftar di bawah Expense_Pie_Chart
- **Percentage_Change**: Persentase perubahan nilai antara dua periode yang dibandingkan
- **FinTrack**: Aplikasi keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu terotentikasi yang menggunakan FinTrack
- **Transaction**: Catatan keuangan berupa pemasukan, pengeluaran, atau transfer
- **Category**: Label klasifikasi untuk Transaction (misalnya Makan, Transport, Kost/Sewa)
- **IDR**: Rupiah Indonesia, mata uang yang digunakan di seluruh FinTrack
- **Recharts**: Library charting React yang digunakan FinTrack untuk visualisasi data
- **RLS**: Row Level Security, fitur Supabase/PostgreSQL yang memastikan isolasi data per User

## Requirements

### Requirement 1: Navigasi Halaman Laporan

**User Story:** Sebagai User, saya ingin mengakses halaman laporan dari navigasi utama, sehingga saya dapat melihat analitik keuangan saya dengan mudah.

#### Acceptance Criteria

1. THE FinTrack SHALL menyediakan menu navigasi "Laporan" pada Bottom_Nav (mobile) dan Sidebar (desktop) yang mengarah ke Reports_Page
2. WHEN a User mengetuk menu "Laporan" pada navigasi, THE FinTrack SHALL menampilkan Reports_Page di route `/reports`
3. THE Reports_Page SHALL menampilkan semua teks UI dalam Bahasa Indonesia

### Requirement 2: Pemilihan Periode Laporan

**User Story:** Sebagai User, saya ingin memilih bulan dan tahun untuk laporan, sehingga saya dapat melihat data keuangan untuk periode tertentu.

#### Acceptance Criteria

1. WHEN a User membuka Reports_Page, THE Period_Selector SHALL menampilkan bulan dan tahun saat ini sebagai periode default
2. WHEN a User mengetuk tombol navigasi bulan sebelumnya pada Period_Selector, THE Period_Selector SHALL berpindah ke bulan sebelumnya dan memperbarui semua visualisasi
3. WHEN a User mengetuk tombol navigasi bulan berikutnya pada Period_Selector, THE Period_Selector SHALL berpindah ke bulan berikutnya dan memperbarui semua visualisasi
4. THE Period_Selector SHALL menampilkan nama bulan dalam Bahasa Indonesia (misalnya "Januari", "Februari") beserta tahun
5. THE Period_Selector SHALL NOT mengizinkan navigasi ke bulan di masa depan yang melampaui bulan berjalan

### Requirement 3: Pie Chart Pengeluaran per Kategori

**User Story:** Sebagai User, saya ingin melihat distribusi pengeluaran saya dalam bentuk pie chart, sehingga saya dapat memahami ke mana uang saya paling banyak dibelanjakan.

#### Acceptance Criteria

1. WHEN a User memilih periode bulan pada Period_Selector, THE Expense_Pie_Chart SHALL menampilkan pie chart yang memvisualisasikan total pengeluaran per Category untuk bulan tersebut
2. THE Expense_Pie_Chart SHALL menampilkan setiap segmen dengan warna berbeda dan label nama Category
3. THE Expense_Pie_Chart SHALL menampilkan persentase kontribusi setiap Category terhadap total pengeluaran
4. WHEN a User mengetuk segmen pada Expense_Pie_Chart, THE Expense_Pie_Chart SHALL menampilkan tooltip berisi nama Category dan jumlah pengeluaran dalam format IDR
5. THE Expense_Pie_Chart SHALL hanya menyertakan Transaction bertipe expense dan mengecualikan Transaction bertipe income dan transfer
6. WHEN tidak ada Transaction bertipe expense pada bulan yang dipilih, THE Expense_Pie_Chart SHALL menampilkan pesan "Belum ada data pengeluaran"

### Requirement 4: Rincian Pengeluaran per Kategori

**User Story:** Sebagai User, saya ingin melihat daftar rincian pengeluaran per kategori, sehingga saya dapat mengetahui jumlah pasti yang dibelanjakan di setiap kategori.

#### Acceptance Criteria

1. WHEN a User memilih periode bulan pada Period_Selector, THE Category_Breakdown SHALL menampilkan daftar semua Category yang memiliki pengeluaran pada bulan tersebut
2. THE Category_Breakdown SHALL menampilkan setiap Category dengan ikon, nama, jumlah pengeluaran dalam format IDR, dan persentase terhadap total pengeluaran
3. THE Category_Breakdown SHALL mengurutkan Category berdasarkan jumlah pengeluaran dari yang terbesar ke terkecil
4. THE Category_Breakdown SHALL menampilkan progress bar berwarna yang sesuai dengan warna segmen pada Expense_Pie_Chart

### Requirement 5: Grafik Tren Pemasukan vs Pengeluaran

**User Story:** Sebagai User, saya ingin melihat tren pemasukan dan pengeluaran saya lintas beberapa bulan, sehingga saya dapat memahami pola keuangan saya dari waktu ke waktu.

#### Acceptance Criteria

1. WHEN a User membuka Reports_Page, THE Income_Expense_Trend_Chart SHALL menampilkan grafik batang yang memvisualisasikan total pemasukan dan total pengeluaran per bulan selama 6 bulan terakhir dari bulan yang dipilih
2. THE Income_Expense_Trend_Chart SHALL menampilkan batang pemasukan dengan warna hijau dan batang pengeluaran dengan warna merah
3. THE Income_Expense_Trend_Chart SHALL menampilkan label bulan pada sumbu X dalam format singkat Bahasa Indonesia (misalnya "Jan", "Feb", "Mar")
4. THE Income_Expense_Trend_Chart SHALL menampilkan nilai pada sumbu Y dalam format IDR yang disingkat (misalnya "1,5jt" untuk Rp 1.500.000)
5. WHEN a User mengetuk batang pada Income_Expense_Trend_Chart, THE Income_Expense_Trend_Chart SHALL menampilkan tooltip berisi bulan, jumlah pemasukan, dan jumlah pengeluaran dalam format IDR
6. THE Income_Expense_Trend_Chart SHALL mengecualikan Transaction bertipe transfer dari perhitungan pemasukan dan pengeluaran

### Requirement 6: Perbandingan Bulan-ke-Bulan

**User Story:** Sebagai User, saya ingin melihat perbandingan keuangan bulan ini dengan bulan sebelumnya, sehingga saya dapat mengetahui apakah pengeluaran saya meningkat atau menurun.

#### Acceptance Criteria

1. WHEN a User memilih periode bulan pada Period_Selector, THE Month_Over_Month_Comparison SHALL menampilkan perbandingan total pemasukan, total pengeluaran, dan selisih bersih antara bulan yang dipilih dan bulan sebelumnya
2. THE Month_Over_Month_Comparison SHALL menampilkan Percentage_Change untuk setiap metrik (pemasukan, pengeluaran, selisih bersih)
3. WHEN Percentage_Change bernilai positif untuk pemasukan atau selisih bersih, THE Month_Over_Month_Comparison SHALL menampilkan indikator berwarna hijau dengan ikon panah ke atas
4. WHEN Percentage_Change bernilai negatif untuk pemasukan atau selisih bersih, THE Month_Over_Month_Comparison SHALL menampilkan indikator berwarna merah dengan ikon panah ke bawah
5. WHEN Percentage_Change bernilai positif untuk pengeluaran, THE Month_Over_Month_Comparison SHALL menampilkan indikator berwarna merah dengan ikon panah ke atas (pengeluaran naik = negatif)
6. WHEN Percentage_Change bernilai negatif untuk pengeluaran, THE Month_Over_Month_Comparison SHALL menampilkan indikator berwarna hijau dengan ikon panah ke bawah (pengeluaran turun = positif)
7. IF bulan sebelumnya tidak memiliki data Transaction, THEN THE Month_Over_Month_Comparison SHALL menampilkan tanda "-" sebagai pengganti Percentage_Change

### Requirement 7: Ringkasan Periode yang Dipilih

**User Story:** Sebagai User, saya ingin melihat ringkasan total pemasukan, pengeluaran, dan selisih untuk periode yang dipilih, sehingga saya dapat memahami kondisi keuangan saya secara keseluruhan.

#### Acceptance Criteria

1. WHEN a User memilih periode bulan pada Period_Selector, THE Report_Summary_Card SHALL menampilkan total pemasukan, total pengeluaran, dan selisih bersih (pemasukan dikurangi pengeluaran) untuk bulan tersebut
2. THE Report_Summary_Card SHALL menampilkan semua nilai moneter dalam format IDR
3. WHEN selisih bersih bernilai positif, THE Report_Summary_Card SHALL menampilkan selisih dengan warna hijau
4. WHEN selisih bersih bernilai negatif, THE Report_Summary_Card SHALL menampilkan selisih dengan warna merah
5. THE Report_Summary_Card SHALL mengecualikan Transaction bertipe transfer dari perhitungan pemasukan dan pengeluaran

### Requirement 8: Ringkasan Tahunan

**User Story:** Sebagai User, saya ingin melihat ringkasan keuangan tahunan, sehingga saya dapat mengevaluasi performa keuangan saya selama satu tahun penuh.

#### Acceptance Criteria

1. WHEN a User mengaktifkan Yearly_Summary_View, THE Reports_Page SHALL menampilkan ringkasan keuangan untuk seluruh tahun kalender yang dipilih
2. THE Yearly_Summary_View SHALL menampilkan total pemasukan tahunan, total pengeluaran tahunan, dan selisih bersih tahunan dalam format IDR
3. THE Yearly_Summary_View SHALL menampilkan grafik batang bulanan yang memvisualisasikan pemasukan dan pengeluaran untuk setiap bulan dalam tahun tersebut (12 bulan)
4. THE Yearly_Summary_View SHALL menampilkan rata-rata pemasukan bulanan dan rata-rata pengeluaran bulanan dalam format IDR
5. WHEN a User memilih tahun yang berbeda, THE Yearly_Summary_View SHALL memperbarui semua data dan visualisasi untuk tahun yang dipilih
6. THE Yearly_Summary_View SHALL menampilkan label bulan pada sumbu X grafik dalam format singkat Bahasa Indonesia

### Requirement 9: Toggle Tampilan Bulanan/Tahunan

**User Story:** Sebagai User, saya ingin beralih antara tampilan bulanan dan tahunan, sehingga saya dapat melihat laporan dalam granularitas yang berbeda.

#### Acceptance Criteria

1. THE Reports_Page SHALL menyediakan toggle atau tab untuk beralih antara tampilan "Bulanan" dan "Tahunan"
2. WHEN a User memilih tab "Bulanan", THE Reports_Page SHALL menampilkan Expense_Pie_Chart, Category_Breakdown, Income_Expense_Trend_Chart, Month_Over_Month_Comparison, dan Report_Summary_Card untuk bulan yang dipilih
3. WHEN a User memilih tab "Tahunan", THE Reports_Page SHALL menampilkan Yearly_Summary_View untuk tahun yang dipilih
4. THE Reports_Page SHALL menampilkan tab "Bulanan" sebagai tampilan default saat pertama kali dibuka

### Requirement 10: Loading dan Empty State pada Laporan

**User Story:** Sebagai User, saya ingin melihat indikator loading dan pesan yang informatif saat data sedang dimuat atau tidak tersedia, sehingga saya memahami status halaman laporan.

#### Acceptance Criteria

1. WHILE data laporan sedang dimuat dari Supabase, THE Reports_Page SHALL menampilkan Skeleton_Loader yang sesuai dengan layout konten yang diharapkan
2. WHEN Reports_Page tidak memiliki Transaction untuk periode yang dipilih, THE Reports_Page SHALL menampilkan pesan empty state "Belum ada data untuk periode ini"
3. IF pengambilan data laporan gagal karena error jaringan, THEN THE Reports_Page SHALL menampilkan pesan error dengan tombol "Coba Lagi"

### Requirement 11: Isolasi Data Laporan

**User Story:** Sebagai User, saya ingin data laporan saya terisolasi dan hanya menampilkan data milik saya, sehingga privasi data keuangan saya terjaga.

#### Acceptance Criteria

1. THE Reports_Page SHALL hanya menampilkan data Transaction milik User yang sedang login, sesuai dengan kebijakan RLS yang sudah ada
2. THE Reports_Page SHALL mengecualikan Transaction yang terkait dengan Account yang telah di-soft-delete dari semua perhitungan dan visualisasi

### Requirement 12: Aksesibilitas Halaman Laporan

**User Story:** Sebagai User, saya ingin halaman laporan dapat diakses menggunakan keyboard dan screen reader, sehingga semua pengguna dapat menggunakan fitur laporan.

#### Acceptance Criteria

1. THE Reports_Page SHALL menyediakan ARIA_Label untuk semua elemen interaktif termasuk Period_Selector, toggle Bulanan/Tahunan, dan segmen chart
2. THE Reports_Page SHALL mendukung navigasi keyboard penuh untuk Period_Selector dan toggle tampilan
3. THE Expense_Pie_Chart SHALL menyediakan tabel data alternatif yang dapat diakses oleh screen reader sebagai pengganti visualisasi grafis
4. THE Reports_Page SHALL mempertahankan rasio kontras warna minimum 4.5:1 untuk semua teks konten

### Requirement 13: Responsivitas Halaman Laporan

**User Story:** Sebagai User, saya ingin halaman laporan tampil dengan baik di perangkat mobile dan desktop, sehingga saya dapat melihat laporan dari perangkat apapun.

#### Acceptance Criteria

1. WHILE viewport width di bawah 768px, THE Reports_Page SHALL menampilkan semua komponen dalam layout satu kolom yang dapat di-scroll secara vertikal
2. WHILE viewport width 768px atau lebih, THE Reports_Page SHALL memanfaatkan ruang horizontal dengan menampilkan Expense_Pie_Chart dan Category_Breakdown secara berdampingan
3. THE Expense_Pie_Chart dan Income_Expense_Trend_Chart SHALL menyesuaikan ukuran secara responsif menggunakan ResponsiveContainer dari Recharts
