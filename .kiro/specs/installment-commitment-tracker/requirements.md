# Dokumen Kebutuhan (Requirements)

## Pendahuluan

Fitur **Installment & Commitment Tracker** menambahkan kemampuan bagi pengguna FinTrack untuk mencatat cicilan aktif (misalnya pembelian via kartu kredit yang dikonversi ke cicilan) dan komitmen berulang (misalnya langganan Netflix, iuran, dll). Fitur ini menghitung **limit efektif** suatu akun dengan mengurangi limit resmi dari bank dengan total kewajiban bulanan yang sudah tercatat, sehingga pengguna tidak terlena dengan angka limit yang ditampilkan bank dan dapat mengantisipasi komitmen finansial yang sudah ada. Fitur ini tidak terbatas pada kartu kredit — akun jenis lain pun dapat memiliki cicilan dan komitmen.

---

## Glosarium

- **Cicilan** *(Installment)*: Kewajiban pembayaran tetap per bulan yang berasal dari pembelian yang dicicil, dengan jumlah angsuran dan tenor tertentu.
- **Cicilan_CC** *(Credit Card Installment)*: Cicilan yang terkait dengan akun bertipe `credit_card`. Angsurannya otomatis terpotong dari limit kartu kredit oleh bank pada tanggal jatuh tempo setiap bulan, tanpa perlu konfirmasi manual dari User.
- **Cicilan_Non_CC** *(Non-CC Installment)*: Cicilan yang terkait dengan akun bertipe selain `credit_card` (misalnya KTA, pinjaman bank). Pembayarannya tidak otomatis dan memerlukan konfirmasi manual dari User setiap bulan.
- **Komitmen_Berulang** *(Recurring_Commitment)*: Kewajiban pembayaran yang berulang setiap bulan tanpa batas waktu tertentu, misalnya langganan streaming, iuran, atau biaya rutin lainnya.
- **Tanggal_Jatuh_Tempo** *(Due Date / Billing Date)*: Tanggal dalam sebulan (1–31) ketika angsuran cicilan jatuh tempo. Untuk Cicilan_CC, ini adalah tanggal bank memotong limit kartu kredit secara otomatis.
- **Status_Pembayaran_Bulanan**: Status per bulan untuk Cicilan_Non_CC yang menunjukkan apakah angsuran bulan tersebut sudah dibayar (`paid`) atau belum (`unpaid`).
- **Angsuran_Sudah_Terpotong**: Kondisi pada Cicilan_CC di mana tanggal hari ini sudah melewati Tanggal_Jatuh_Tempo bulan berjalan, sehingga angsuran bulan ini dianggap sudah otomatis terpotong dari limit kartu kredit.
- **Tenor**: Jumlah total bulan cicilan yang disepakati saat cicilan dibuat.
- **Sisa_Tenor**: Jumlah bulan cicilan yang belum dibayar, dihitung dari bulan berjalan hingga bulan terakhir cicilan.
- **Angsuran_Bulanan**: Jumlah yang harus dibayar setiap bulan untuk satu Cicilan.
- **Total_Kewajiban_Bulanan**: Jumlah dari seluruh Angsuran_Bulanan cicilan aktif ditambah seluruh Komitmen_Berulang aktif yang terkait dengan satu akun.
- **Limit_Efektif**: Nilai limit akun dikurangi Total_Kewajiban_Bulanan. Untuk akun kartu kredit, limit yang digunakan adalah `credit_limit`. Untuk akun lain, limit yang digunakan adalah nilai yang diisikan pengguna pada field `commitment_limit`.
- **Limit_Real_Sekarang** *(current_effective_limit)*: Nilai limit akun dikurangi kewajiban yang sudah jatuh tempo pada bulan berjalan. Untuk akun `credit_card`, ini adalah `credit_limit` dikurangi Angsuran_Bulanan dari Cicilan_CC yang berstatus Angsuran_Sudah_Terpotong ditambah Komitmen_Berulang yang sudah jatuh tempo bulan ini. Untuk akun non-CC, ini adalah `commitment_limit` dikurangi kewajiban yang sudah dikonfirmasi dibayar bulan ini. Nilai ini mencerminkan kondisi limit yang benar-benar tersisa hari ini.
- **Prediksi_Limit_Tagihan** *(projected_effective_limit)*: Nilai limit akun dikurangi seluruh kewajiban aktif bulan berjalan maupun mendatang, tanpa memandang status pemotongan. Untuk akun `credit_card`, ini adalah `credit_limit` dikurangi Total_Kewajiban_Bulanan penuh (semua Cicilan_CC aktif + semua Komitmen_Berulang aktif). Untuk akun non-CC, ini adalah `commitment_limit` dikurangi Total_Kewajiban_Bulanan penuh. Nilai ini adalah proyeksi — berapa limit yang akan tersisa setelah semua tagihan bulan ini terpotong.
- **Commitment_Limit**: Nilai batas yang ditetapkan pengguna pada akun non-kartu-kredit sebagai acuan perhitungan Limit_Real_Sekarang dan Prediksi_Limit_Tagihan.
- **Tracker**: Halaman atau panel dalam FinTrack yang menampilkan daftar cicilan, komitmen berulang, dan ringkasan Limit_Efektif per akun.
- **FinTrack**: Aplikasi personal finance yang sedang dikembangkan.
- **Akun**: Akun keuangan milik pengguna (bank, e-wallet, cash, kartu kredit, investasi, tabungan, dll).
- **User**: Pengguna terautentikasi yang menggunakan FinTrack.

---

## Kebutuhan

### Kebutuhan 1: Pencatatan Cicilan

**User Story:** Sebagai User, saya ingin mencatat cicilan dari pembelian yang dicicil, sehingga saya dapat melacak berapa angsuran per bulan, sisa tenor, dan total sisa hutang untuk setiap cicilan.

#### Kriteria Penerimaan

1. WHEN User mengisi form tambah cicilan dengan nama, akun terkait, jumlah angsuran per bulan, tenor (jumlah bulan), tanggal mulai, dan Tanggal_Jatuh_Tempo, THE Tracker SHALL menyimpan cicilan dan menampilkannya dalam daftar cicilan aktif.
2. THE Tracker SHALL menentukan tipe cicilan secara otomatis berdasarkan tipe akun yang dipilih: jika akun bertipe `credit_card` maka cicilan bertipe `Cicilan_CC`, selain itu bertipe `Cicilan_Non_CC`.
3. THE Tracker SHALL menghitung Sisa_Tenor sebagai selisih antara bulan berakhirnya cicilan dan bulan berjalan, dalam satuan bulan.
4. THE Tracker SHALL menghitung total sisa hutang cicilan sebagai hasil perkalian Angsuran_Bulanan dengan Sisa_Tenor.
5. WHEN User menambahkan cicilan, THE Tracker SHALL memungkinkan User memilih akun dari semua tipe akun yang tersedia, tidak terbatas pada kartu kredit.
6. IF User mengisi form cicilan dengan tenor kurang dari 1, angsuran bulanan kurang dari atau sama dengan 0, atau Tanggal_Jatuh_Tempo di luar rentang 1–31, THEN THE Tracker SHALL menampilkan pesan validasi dan mencegah penyimpanan.
7. WHEN Sisa_Tenor sebuah cicilan mencapai 0, THE Tracker SHALL menandai cicilan tersebut sebagai selesai dan memindahkannya ke daftar cicilan selesai.
8. WHERE User mengaktifkan opsi catatan tambahan, THE Tracker SHALL menyimpan dan menampilkan catatan teks bebas untuk cicilan tersebut.

---

### Kebutuhan 1a: Perilaku Cicilan Kartu Kredit (Cicilan_CC)

**User Story:** Sebagai User dengan cicilan kartu kredit, saya ingin sistem otomatis memperhitungkan angsuran yang sudah jatuh tempo tanpa perlu input manual, sehingga limit efektif kartu kredit saya selalu mencerminkan kondisi nyata.

#### Kriteria Penerimaan

1. WHEN tanggal hari ini sudah melewati atau sama dengan Tanggal_Jatuh_Tempo bulan berjalan untuk sebuah Cicilan_CC aktif, THE Tracker SHALL menandai kondisi tersebut sebagai Angsuran_Sudah_Terpotong untuk bulan berjalan.
2. WHILE kondisi Angsuran_Sudah_Terpotong berlaku untuk sebuah Cicilan_CC, THE Tracker SHALL memperhitungkan Angsuran_Bulanan cicilan tersebut sebagai beban yang sudah terefleksi dalam saldo/limit kartu kredit — tanpa memerlukan input transaksi manual dari User.
3. THE Tracker SHALL selalu menyertakan seluruh Angsuran_Bulanan dari semua Cicilan_CC aktif dalam perhitungan Total_Kewajiban_Bulanan, terlepas dari apakah angsuran bulan ini sudah terpotong atau belum.
4. THE Tracker SHALL menampilkan indikator visual pada setiap Cicilan_CC yang menunjukkan status angsuran bulan berjalan: "Sudah terpotong" (jika hari ini ≥ Tanggal_Jatuh_Tempo) atau "Belum jatuh tempo" (jika hari ini < Tanggal_Jatuh_Tempo).
5. THE Tracker SHALL TIDAK memerlukan User untuk mengkonfirmasi pembayaran angsuran Cicilan_CC secara manual.

---

### Kebutuhan 1b: Perilaku Cicilan Non-Kartu-Kredit (Cicilan_Non_CC)

**User Story:** Sebagai User dengan cicilan non-kartu-kredit (KTA, pinjaman, dll), saya ingin mengkonfirmasi secara manual apakah angsuran bulan ini sudah dibayar, sehingga sistem dapat menampilkan kewajiban yang masih outstanding dengan akurat.

#### Kriteria Penerimaan

1. THE Tracker SHALL menyimpan Status_Pembayaran_Bulanan per bulan untuk setiap Cicilan_Non_CC aktif, dengan nilai awal `unpaid` untuk setiap bulan baru.
2. WHEN tanggal hari ini sudah melewati atau sama dengan Tanggal_Jatuh_Tempo bulan berjalan untuk sebuah Cicilan_Non_CC dengan Status_Pembayaran_Bulanan `unpaid`, THE Tracker SHALL menampilkan cicilan tersebut sebagai kewajiban outstanding yang perlu dikonfirmasi.
3. WHEN User mengkonfirmasi pembayaran angsuran bulan berjalan untuk sebuah Cicilan_Non_CC, THE Tracker SHALL mengubah Status_Pembayaran_Bulanan bulan tersebut menjadi `paid` dan menampilkan konfirmasi visual.
4. WHILE Status_Pembayaran_Bulanan bulan berjalan sebuah Cicilan_Non_CC adalah `unpaid`, THE Tracker SHALL tetap menyertakan Angsuran_Bulanan cicilan tersebut dalam Total_Kewajiban_Bulanan sebagai kewajiban outstanding.
5. WHILE Status_Pembayaran_Bulanan bulan berjalan sebuah Cicilan_Non_CC adalah `paid`, THE Tracker SHALL tetap menyertakan Angsuran_Bulanan cicilan tersebut dalam Total_Kewajiban_Bulanan untuk bulan-bulan mendatang yang belum dibayar.
6. THE Tracker SHALL menampilkan riwayat Status_Pembayaran_Bulanan untuk setiap Cicilan_Non_CC sehingga User dapat melihat bulan mana saja yang sudah dan belum dibayar.

---

### Kebutuhan 2: Pencatatan Komitmen Berulang

**User Story:** Sebagai User, saya ingin mencatat komitmen berulang seperti langganan atau iuran bulanan, sehingga saya dapat memperhitungkan pengeluaran rutin ini dalam perencanaan keuangan saya.

#### Kriteria Penerimaan

1. WHEN User mengisi form tambah komitmen berulang dengan nama, akun terkait, dan jumlah per bulan, THE Tracker SHALL menyimpan komitmen dan menampilkannya dalam daftar komitmen aktif.
2. THE Tracker SHALL memungkinkan User memilih akun dari semua tipe akun yang tersedia saat menambahkan Komitmen_Berulang.
3. WHEN User menonaktifkan sebuah Komitmen_Berulang, THE Tracker SHALL menandainya sebagai tidak aktif dan mengecualikannya dari perhitungan Total_Kewajiban_Bulanan.
4. IF User mengisi form komitmen berulang dengan jumlah per bulan kurang dari atau sama dengan 0, THEN THE Tracker SHALL menampilkan pesan validasi dan mencegah penyimpanan.
5. WHERE User mengaktifkan opsi catatan tambahan, THE Tracker SHALL menyimpan dan menampilkan catatan teks bebas untuk komitmen tersebut.

---

### Kebutuhan 3: Perhitungan Limit Efektif per Akun

**User Story:** Sebagai User, saya ingin melihat dua angka limit efektif setiap akun — kondisi nyata hari ini dan proyeksi setelah semua tagihan terpotong — sehingga saya mengetahui kapasitas keuangan nyata yang tersisa dan dapat mengantisipasi kewajiban mendatang.

#### Kriteria Penerimaan

1. THE Tracker SHALL menghitung Total_Kewajiban_Bulanan per akun sebagai jumlah dari seluruh Angsuran_Bulanan cicilan aktif ditambah seluruh jumlah Komitmen_Berulang aktif yang terkait dengan akun tersebut.
2. WHILE akun bertipe `credit_card` dan memiliki `credit_limit` yang dikonfigurasi, THE Tracker SHALL menghitung Limit_Real_Sekarang sebagai `credit_limit` dikurangi jumlah Angsuran_Bulanan dari Cicilan_CC yang berstatus Angsuran_Sudah_Terpotong pada bulan berjalan ditambah jumlah Komitmen_Berulang aktif yang Tanggal_Jatuh_Tempo-nya sudah terlewati bulan ini.
3. WHILE akun bertipe `credit_card` dan memiliki `credit_limit` yang dikonfigurasi, THE Tracker SHALL menghitung Prediksi_Limit_Tagihan sebagai `credit_limit` dikurangi Total_Kewajiban_Bulanan penuh (seluruh Cicilan_CC aktif dan seluruh Komitmen_Berulang aktif), tanpa memandang status pemotongan bulan berjalan.
4. WHILE akun bertipe selain `credit_card` dan memiliki `commitment_limit` yang dikonfigurasi, THE Tracker SHALL menghitung Limit_Real_Sekarang sebagai `commitment_limit` dikurangi jumlah Angsuran_Bulanan dari Cicilan_Non_CC yang Status_Pembayaran_Bulanan bulan berjalan-nya adalah `paid` ditambah Komitmen_Berulang aktif yang sudah jatuh tempo bulan ini.
5. WHILE akun bertipe selain `credit_card` dan memiliki `commitment_limit` yang dikonfigurasi, THE Tracker SHALL menghitung Prediksi_Limit_Tagihan sebagai `commitment_limit` dikurangi Total_Kewajiban_Bulanan penuh (seluruh cicilan aktif dan seluruh Komitmen_Berulang aktif).
6. WHEN Prediksi_Limit_Tagihan sebuah akun bernilai negatif, THE Tracker SHALL menampilkan nilai tersebut dengan indikator visual peringatan berwarna merah.
7. THE Tracker SHALL menampilkan ringkasan per akun yang mencakup: nama akun, limit resmi (credit_limit atau commitment_limit), Total_Kewajiban_Bulanan, Limit_Real_Sekarang, dan Prediksi_Limit_Tagihan.
8. WHEN cicilan baru ditambahkan atau komitmen berulang diubah, THE Tracker SHALL memperbarui perhitungan Limit_Real_Sekarang dan Prediksi_Limit_Tagihan secara langsung tanpa memerlukan refresh halaman.

---

### Kebutuhan 4: Tampilan Ringkasan Tracker

**User Story:** Sebagai User, saya ingin melihat ringkasan semua cicilan dan komitmen dalam satu tampilan terpadu, sehingga saya dapat memantau seluruh kewajiban finansial saya sekaligus.

#### Kriteria Penerimaan

1. WHEN User membuka halaman Tracker, THE Tracker SHALL menampilkan daftar akun yang memiliki cicilan atau komitmen aktif beserta ringkasan Limit_Real_Sekarang dan Prediksi_Limit_Tagihan masing-masing secara berdampingan dengan label yang jelas.
2. WHEN User memilih sebuah akun di Tracker, THE Tracker SHALL menampilkan detail cicilan aktif dan komitmen berulang aktif yang terkait dengan akun tersebut.
3. THE Tracker SHALL menampilkan untuk setiap cicilan aktif: nama cicilan, tipe cicilan (CC atau Non-CC), Angsuran_Bulanan, Tanggal_Jatuh_Tempo, Sisa_Tenor (dalam bulan), dan total sisa hutang.
4. THE Tracker SHALL menampilkan untuk setiap Cicilan_CC aktif: indikator status angsuran bulan berjalan ("Sudah terpotong" atau "Belum jatuh tempo").
5. THE Tracker SHALL menampilkan untuk setiap Cicilan_Non_CC aktif: Status_Pembayaran_Bulanan bulan berjalan ("Sudah dibayar" atau "Belum dibayar") beserta tombol konfirmasi pembayaran jika status masih `unpaid`.
6. THE Tracker SHALL menampilkan untuk setiap Komitmen_Berulang aktif: nama komitmen, jumlah per bulan, dan status aktif/tidak aktif.
7. WHEN halaman Tracker tidak memiliki cicilan atau komitmen yang tercatat, THE Tracker SHALL menampilkan pesan kosong yang mengajak User untuk menambahkan cicilan atau komitmen pertama.
8. THE Tracker SHALL menampilkan total keseluruhan kewajiban bulanan dari semua akun yang aktif dalam satu baris ringkasan di bagian atas halaman.
9. THE Tracker SHALL menampilkan label yang membedakan kedua angka limit secara eksplisit: "Limit Sekarang" untuk Limit_Real_Sekarang dan "Prediksi Setelah Tagihan" untuk Prediksi_Limit_Tagihan, sehingga User dapat memahami perbedaan keduanya tanpa penjelasan tambahan.

---

### Kebutuhan 5: Pengelolaan Cicilan dan Komitmen

**User Story:** Sebagai User, saya ingin dapat mengedit dan menghapus cicilan serta komitmen yang sudah tercatat, sehingga saya dapat menjaga data tetap akurat ketika ada perubahan.

#### Kriteria Penerimaan

1. WHEN User mengedit cicilan yang sudah ada, THE Tracker SHALL memperbarui data cicilan dan menghitung ulang Sisa_Tenor, total sisa hutang, dan Limit_Efektif akun terkait.
2. WHEN User menghapus cicilan, THE Tracker SHALL menampilkan Confirmation_Dialog dan setelah dikonfirmasi, menghapus cicilan serta memperbarui Limit_Efektif akun terkait.
3. WHEN User mengedit Komitmen_Berulang yang sudah ada, THE Tracker SHALL memperbarui data komitmen dan menghitung ulang Total_Kewajiban_Bulanan serta Limit_Efektif akun terkait.
4. WHEN User menghapus Komitmen_Berulang, THE Tracker SHALL menampilkan Confirmation_Dialog dan setelah dikonfirmasi, menghapus komitmen serta memperbarui Limit_Efektif akun terkait.
5. IF operasi simpan, edit, atau hapus cicilan maupun komitmen gagal karena kesalahan jaringan, THEN THE Tracker SHALL menampilkan Error_Toast dengan pesan deskriptif dan opsi untuk mencoba ulang.

---

### Kebutuhan 6: Konfigurasi Commitment Limit pada Akun Non-Kartu-Kredit

**User Story:** Sebagai User, saya ingin menetapkan batas komitmen pada akun non-kartu-kredit, sehingga saya dapat menghitung Limit_Efektif untuk akun tersebut.

#### Kriteria Penerimaan

1. WHEN User mengedit akun bertipe selain `credit_card`, THE FinTrack SHALL menampilkan field opsional `Batas Komitmen (IDR)` pada form edit akun.
2. WHEN User menyimpan nilai `commitment_limit` pada akun, THE FinTrack SHALL menyimpan nilai tersebut dan menggunakannya sebagai dasar perhitungan Limit_Real_Sekarang dan Prediksi_Limit_Tagihan di Tracker.
3. IF akun tidak memiliki `commitment_limit` yang dikonfigurasi, THEN THE Tracker SHALL menampilkan Limit_Real_Sekarang dan Prediksi_Limit_Tagihan sebagai "Tidak dikonfigurasi" dan tidak melakukan perhitungan numerik.

---

### Kebutuhan 7: Integrasi dengan Halaman Akun

**User Story:** Sebagai User, saya ingin melihat ringkasan cicilan dan limit efektif langsung di kartu akun pada halaman Akun, sehingga saya mendapat gambaran cepat tanpa harus membuka halaman Tracker.

#### Kriteria Penerimaan

1. WHILE akun memiliki cicilan aktif atau komitmen berulang aktif, THE FinTrack SHALL menampilkan indikator ringkasan pada AccountCard yang menunjukkan Total_Kewajiban_Bulanan, Limit_Real_Sekarang, dan Prediksi_Limit_Tagihan.
2. WHEN User menekan indikator ringkasan pada AccountCard, THE FinTrack SHALL menavigasi User ke halaman Tracker dengan akun tersebut sudah terpilih.
3. WHILE akun tidak memiliki cicilan atau komitmen aktif, THE FinTrack SHALL tidak menampilkan indikator ringkasan pada AccountCard.

---

### Kebutuhan 8: Notifikasi Peringatan Limit Efektif dan Hari Pembayaran

**User Story:** Sebagai User, saya ingin mendapat peringatan ketika Prediksi_Limit_Tagihan suatu akun mendekati nol atau sudah negatif, serta pengingat pada hari jatuh tempo cicilan, sehingga saya dapat segera mengambil tindakan.

#### Kriteria Penerimaan

1. WHEN Prediksi_Limit_Tagihan sebuah akun bernilai kurang dari 10% dari nilai limit resmi akun tersebut, THE FinTrack SHALL membuat notifikasi peringatan dengan tipe `commitment_alert` untuk User tersebut.
2. WHEN Prediksi_Limit_Tagihan sebuah akun bernilai negatif, THE FinTrack SHALL membuat notifikasi peringatan dengan tipe `commitment_alert` yang menyatakan bahwa kewajiban bulanan telah melebihi limit akun.
3. THE FinTrack SHALL menerapkan deduplication sehingga notifikasi `commitment_alert` untuk akun yang sama tidak dibuat lebih dari satu kali dalam satu hari kalender.
4. WHEN tanggal hari ini sama dengan Tanggal_Jatuh_Tempo sebuah cicilan aktif, THE FinTrack SHALL membuat notifikasi dengan tipe `payment_due_today` yang menyebutkan nama cicilan, nama akun, dan jumlah Angsuran_Bulanan.
5. WHILE notifikasi `payment_due_today` dibuat untuk sebuah Cicilan_CC, THE FinTrack SHALL menggunakan pesan: "Hari ini limit [nama akun] akan terpotong sebesar [jumlah] untuk cicilan [nama cicilan]".
6. WHILE notifikasi `payment_due_today` dibuat untuk sebuah Cicilan_Non_CC, THE FinTrack SHALL menggunakan pesan: "Hari ini adalah hari pembayaran cicilan [nama cicilan] sebesar [jumlah] — jangan lupa bayar!".
7. THE FinTrack SHALL menerapkan deduplication sehingga notifikasi `payment_due_today` untuk cicilan yang sama tidak dibuat lebih dari satu kali dalam satu hari kalender.

---

### Kebutuhan 9: Keamanan Data dan Isolasi

**User Story:** Sebagai User, saya ingin data cicilan dan komitmen saya terisolasi dari pengguna lain, sehingga privasi finansial saya terjaga.

#### Kriteria Penerimaan

1. THE RLS SHALL memastikan bahwa setiap User hanya dapat membaca, membuat, memperbarui, dan menghapus cicilan dan komitmen miliknya sendiri.
2. THE FinTrack SHALL memvalidasi bahwa akun yang dipilih saat membuat cicilan atau komitmen adalah milik User yang sedang terautentikasi sebelum menyimpan data.

---

### Kebutuhan 10: Tampilan dan Format Data

**User Story:** Sebagai User, saya ingin semua nilai moneter di Tracker ditampilkan dalam format IDR yang konsisten, sehingga saya dapat membaca data keuangan dengan mudah.

#### Kriteria Penerimaan

1. THE Tracker SHALL memformat semua nilai moneter (Angsuran_Bulanan, total sisa hutang, Total_Kewajiban_Bulanan, Limit_Real_Sekarang, Prediksi_Limit_Tagihan) menggunakan format IDR (contoh: Rp 1.500.000).
2. THE Tracker SHALL menampilkan Sisa_Tenor dalam satuan bulan dengan label yang jelas (contoh: "8 bulan lagi").
3. WHILE data cicilan atau komitmen sedang dimuat dari server, THE Tracker SHALL menampilkan Skeleton_Loader yang sesuai dengan tata letak konten yang diharapkan.
