# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk fitur Financial Goals pada aplikasi FinTrack. Fitur ini memungkinkan User untuk membuat, mengelola, dan melacak tujuan keuangan (misalnya menabung untuk liburan, dana darurat, melunasi hutang). Setiap goal memiliki target nominal, tenggat waktu opsional, dan dapat dikaitkan dengan satu atau lebih Account sebagai sumber dana. FinTrack akan menampilkan progres visual, estimasi pencapaian, serta milestone notifications saat goal mendekati atau tercapai.

Fitur ini berbeda dari Savings_Account/Emergency_Fund_Account yang sudah ada (yang merupakan tipe akun dengan target_amount sederhana). Financial Goals adalah entitas terpisah yang lebih fleksibel — mendukung berbagai kategori goal, pelacakan kontribusi manual, deadline, dan visualisasi progres yang lebih kaya di halaman khusus dan Dashboard.

## Glossary

- **FinTrack**: Aplikasi web keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu yang terautentikasi yang menggunakan FinTrack
- **Account**: Rekening keuangan milik User (bank, e-wallet, cash, credit_card, investment, tabungan, dana_darurat)
- **Transaction**: Catatan keuangan berupa pemasukan, pengeluaran, atau transfer
- **Financial_Goal**: Entitas yang merepresentasikan tujuan keuangan User dengan target nominal, kategori, dan tenggat waktu opsional
- **Goal_Category**: Klasifikasi tujuan keuangan, misalnya: "Tabungan", "Dana Darurat", "Liburan", "Pendidikan", "Pelunasan Hutang", "Lainnya"
- **Goal_Contribution**: Catatan penambahan dana ke Financial_Goal, baik secara manual maupun dari transfer Transaction
- **Goal_Progress**: Persentase pencapaian Financial_Goal berdasarkan total kontribusi terhadap target_amount
- **Goal_Status**: Status Financial_Goal: "active" (sedang berjalan), "completed" (tercapai), atau "cancelled" (dibatalkan)
- **Goal_Milestone**: Titik pencapaian persentase tertentu (25%, 50%, 75%, 100%) pada Financial_Goal
- **Goal_Card**: Komponen UI yang menampilkan ringkasan satu Financial_Goal beserta progress bar
- **Goal_Form**: Modal form untuk membuat atau mengedit Financial_Goal
- **Goal_Detail_View**: Tampilan detail satu Financial_Goal yang menampilkan riwayat kontribusi dan statistik
- **Goals_Page**: Halaman khusus `/goals` yang menampilkan semua Financial_Goal milik User
- **Dashboard**: Halaman utama yang menampilkan ringkasan keuangan
- **Notification**: Pesan in-app yang dihasilkan oleh sistem untuk memberi tahu User tentang event tertentu
- **RLS**: Row Level Security pada Supabase/PostgreSQL untuk isolasi data per User
- **formatIDR**: Fungsi utilitas yang memformat angka ke format mata uang IDR

## Requirements

### Requirement 1: Pembuatan Financial Goal

**User Story:** Sebagai User, saya ingin membuat tujuan keuangan baru dengan target nominal dan detail lainnya, sehingga saya dapat merencanakan dan melacak pencapaian tujuan keuangan saya.

#### Acceptance Criteria

1. WHEN User mengklik tombol "Tambah Goal" pada Goals_Page, THE FinTrack SHALL menampilkan Goal_Form dengan field: nama goal, Goal_Category, target_amount, target_date (opsional), dan catatan (opsional)
2. THE Goal_Form SHALL menyediakan pilihan Goal_Category berikut: "Tabungan", "Dana Darurat", "Liburan", "Pendidikan", "Pelunasan Hutang", dan "Lainnya"
3. WHEN User mengisi Goal_Form dengan data valid dan menekan tombol simpan, THE FinTrack SHALL menyimpan Financial_Goal baru dengan Goal_Status "active" dan current_amount 0
4. THE Goal_Form SHALL memvalidasi bahwa nama goal tidak kosong dan target_amount lebih besar dari 0
5. IF target_date diisi dengan tanggal yang sudah lewat, THEN THE Goal_Form SHALL menampilkan pesan error "Tanggal target harus di masa depan"
6. WHEN Financial_Goal berhasil disimpan, THE FinTrack SHALL menutup Goal_Form dan menampilkan Goal baru pada Goals_Page

### Requirement 2: Pengelolaan Financial Goal

**User Story:** Sebagai User, saya ingin mengedit dan menghapus tujuan keuangan, sehingga saya dapat menyesuaikan rencana keuangan sesuai perubahan kebutuhan.

#### Acceptance Criteria

1. WHEN User mengklik tombol edit pada Goal_Card, THE FinTrack SHALL menampilkan Goal_Form yang terisi dengan data Financial_Goal saat ini
2. WHEN User mengubah data pada Goal_Form dan menekan simpan, THE FinTrack SHALL memperbarui Financial_Goal dengan data baru
3. WHEN User mengklik tombol hapus pada Goal_Card, THE FinTrack SHALL menampilkan dialog konfirmasi sebelum menghapus Financial_Goal
4. WHEN User mengkonfirmasi penghapusan, THE FinTrack SHALL menghapus Financial_Goal beserta semua Goal_Contribution terkait dari database
5. WHEN User mengklik tombol "Batalkan Goal" pada Goal_Detail_View, THE FinTrack SHALL mengubah Goal_Status menjadi "cancelled" dan menampilkan indikator visual bahwa goal telah dibatalkan

### Requirement 3: Kontribusi ke Financial Goal

**User Story:** Sebagai User, saya ingin mencatat kontribusi dana ke tujuan keuangan saya, sehingga progres pencapaian goal terupdate secara akurat.

#### Acceptance Criteria

1. WHEN User mengklik tombol "Tambah Kontribusi" pada Goal_Detail_View, THE FinTrack SHALL menampilkan form kontribusi dengan field: jumlah dan catatan (opsional)
2. THE FinTrack SHALL memvalidasi bahwa jumlah kontribusi lebih besar dari 0
3. WHEN User menyimpan kontribusi yang valid, THE FinTrack SHALL membuat Goal_Contribution baru dan menambahkan jumlahnya ke current_amount pada Financial_Goal secara atomik
4. WHEN current_amount pada Financial_Goal mencapai atau melebihi target_amount setelah kontribusi, THE FinTrack SHALL mengubah Goal_Status menjadi "completed" secara otomatis
5. THE Goal_Detail_View SHALL menampilkan riwayat semua Goal_Contribution diurutkan dari yang terbaru, dengan jumlah, catatan, dan tanggal

### Requirement 4: Penarikan Kontribusi dari Financial Goal

**User Story:** Sebagai User, saya ingin dapat menarik kontribusi dari tujuan keuangan jika ada kebutuhan mendesak, sehingga dana tetap fleksibel.

#### Acceptance Criteria

1. WHEN User mengklik tombol "Tarik Dana" pada Goal_Detail_View, THE FinTrack SHALL menampilkan form penarikan dengan field: jumlah dan catatan (opsional)
2. THE FinTrack SHALL memvalidasi bahwa jumlah penarikan lebih besar dari 0 dan tidak melebihi current_amount pada Financial_Goal
3. WHEN User menyimpan penarikan yang valid, THE FinTrack SHALL membuat Goal_Contribution dengan jumlah negatif dan mengurangi current_amount pada Financial_Goal secara atomik
4. WHEN Financial_Goal memiliki Goal_Status "completed" dan current_amount turun di bawah target_amount setelah penarikan, THE FinTrack SHALL mengubah Goal_Status kembali menjadi "active"

### Requirement 5: Visualisasi Progres Financial Goal

**User Story:** Sebagai User, saya ingin melihat progres pencapaian tujuan keuangan secara visual, sehingga saya termotivasi dan dapat memantau kemajuan dengan mudah.

#### Acceptance Criteria

1. THE Goal_Card SHALL menampilkan progress bar yang menunjukkan Goal_Progress (current_amount / target_amount × 100%)
2. THE Goal_Card SHALL menampilkan nama goal, Goal_Category icon, current_amount, target_amount, dan Goal_Progress dalam format persentase
3. WHEN Financial_Goal memiliki target_date, THE Goal_Card SHALL menampilkan sisa hari menuju target_date
4. WHEN Goal_Progress mencapai atau melebihi 100%, THE Goal_Card SHALL menampilkan indikator visual "Tercapai" dengan ikon centang
5. WHILE Goal_Status adalah "cancelled", THE Goal_Card SHALL menampilkan indikator visual bahwa goal telah dibatalkan dengan tampilan yang dimmed
6. THE Goal_Detail_View SHALL menampilkan sisa nominal yang dibutuhkan (target_amount - current_amount) untuk mencapai Financial_Goal

### Requirement 6: Halaman Goals

**User Story:** Sebagai User, saya ingin memiliki halaman khusus untuk melihat semua tujuan keuangan saya, sehingga saya dapat mengelola dan memantau semua goal di satu tempat.

#### Acceptance Criteria

1. THE FinTrack SHALL menyediakan halaman Goals_Page yang dapat diakses melalui navigasi utama (Sidebar di desktop, Bottom_Nav di mobile)
2. WHEN User membuka Goals_Page, THE FinTrack SHALL menampilkan semua Financial_Goal milik User yang berstatus "active" secara default
3. THE Goals_Page SHALL menyediakan filter untuk menampilkan goal berdasarkan Goal_Status: "Aktif", "Tercapai", dan "Dibatalkan"
4. WHEN tidak ada Financial_Goal, THE Goals_Page SHALL menampilkan empty state dengan pesan ajakan dan tombol "Tambah Goal"
5. THE Goals_Page SHALL mengurutkan Financial_Goal berdasarkan tanggal pembuatan dari yang terbaru

### Requirement 7: Ringkasan Goals di Dashboard

**User Story:** Sebagai User, saya ingin melihat ringkasan tujuan keuangan aktif di dashboard, sehingga saya dapat memantau progres tanpa harus membuka halaman Goals.

#### Acceptance Criteria

1. WHEN User membuka Dashboard, THE FinTrack SHALL menampilkan section "Tujuan Keuangan" yang berisi ringkasan Financial_Goal aktif (maksimal 3 goal dengan progres tertinggi)
2. THE FinTrack SHALL menampilkan setiap goal dengan nama, progress bar mini, dan persentase pencapaian
3. WHEN terdapat lebih dari 3 Financial_Goal aktif, THE Dashboard SHALL menampilkan link "Lihat Semua" yang mengarah ke Goals_Page
4. WHEN tidak ada Financial_Goal aktif, THE FinTrack SHALL menyembunyikan section "Tujuan Keuangan" dari Dashboard

### Requirement 8: Notifikasi Milestone Goal

**User Story:** Sebagai User, saya ingin menerima notifikasi saat tujuan keuangan mencapai milestone tertentu, sehingga saya mendapat motivasi dan informasi pencapaian.

#### Acceptance Criteria

1. WHEN Goal_Progress mencapai 25%, THE FinTrack SHALL membuat Notification dengan pesan yang menyebutkan nama goal dan pencapaian 25%
2. WHEN Goal_Progress mencapai 50%, THE FinTrack SHALL membuat Notification dengan pesan yang menyebutkan nama goal dan pencapaian 50%
3. WHEN Goal_Progress mencapai 75%, THE FinTrack SHALL membuat Notification dengan pesan yang menyebutkan nama goal dan pencapaian 75%
4. WHEN Goal_Progress mencapai 100%, THE FinTrack SHALL membuat Notification dengan pesan ucapan selamat yang menyebutkan nama goal
5. THE FinTrack SHALL membuat satu Notification per Goal_Milestone per Financial_Goal, tanpa duplikasi untuk milestone yang sama

### Requirement 9: Estimasi Waktu Pencapaian Goal

**User Story:** Sebagai User, saya ingin melihat estimasi kapan tujuan keuangan akan tercapai berdasarkan rata-rata kontribusi, sehingga saya dapat mengevaluasi apakah target realistis.

#### Acceptance Criteria

1. WHEN Financial_Goal memiliki minimal 2 Goal_Contribution, THE Goal_Detail_View SHALL menampilkan estimasi tanggal pencapaian berdasarkan rata-rata kontribusi bulanan
2. WHEN rata-rata kontribusi bulanan adalah 0 atau negatif, THE Goal_Detail_View SHALL menampilkan pesan "Estimasi tidak tersedia — tambahkan kontribusi untuk melihat proyeksi"
3. WHEN Financial_Goal memiliki target_date dan estimasi pencapaian melampaui target_date, THE Goal_Detail_View SHALL menampilkan peringatan bahwa target mungkin tidak tercapai tepat waktu

### Requirement 10: Penyimpanan Data Financial Goal

**User Story:** Sebagai User, saya ingin data tujuan keuangan tersimpan dengan aman di database, sehingga data tetap tersedia dan terisolasi per pengguna.

#### Acceptance Criteria

1. THE FinTrack SHALL menyimpan setiap Financial_Goal dalam tabel financial_goals dengan kolom: id, user_id, name, category, target_amount, current_amount, target_date, note, status, created_at, dan updated_at
2. THE FinTrack SHALL menyimpan setiap Goal_Contribution dalam tabel goal_contributions dengan kolom: id, goal_id, user_id, amount, note, dan created_at
3. THE RLS SHALL memastikan setiap User hanya dapat membaca, membuat, memperbarui, dan menghapus Financial_Goal dan Goal_Contribution miliknya sendiri
4. THE FinTrack SHALL memastikan current_amount pada Financial_Goal selalu konsisten dengan total semua Goal_Contribution terkait
