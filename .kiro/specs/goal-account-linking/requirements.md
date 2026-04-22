# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk fitur Goal-Account Linking pada aplikasi FinTrack. Saat ini, kontribusi ke Financial_Goal bersifat pencatatan manual — User hanya memasukkan angka dan current_amount pada goal bertambah tanpa ada perubahan pada saldo Account manapun. Fitur ini menghubungkan kontribusi goal dengan Account sumber dana, sehingga saat User menambah kontribusi, saldo Account berkurang secara atomik bersamaan dengan bertambahnya current_amount pada goal. Demikian pula saat penarikan, User memilih Account tujuan dan saldo Account bertambah bersamaan dengan berkurangnya current_amount pada goal.

Fitur ini merupakan alokasi dana internal (transfer dari Account ke Goal), bukan pengeluaran (expense). Oleh karena itu, kontribusi dan penarikan goal tidak boleh memengaruhi laporan pemasukan/pengeluaran. Setiap Goal_Contribution akan mencatat account_id yang digunakan sebagai sumber atau tujuan dana.

## Glossary

- **FinTrack**: Aplikasi web keuangan pribadi yang sedang dispesifikasikan
- **User**: Individu yang terautentikasi yang menggunakan FinTrack
- **Account**: Rekening keuangan milik User (bank, e-wallet, cash, credit_card, investment, tabungan, dana_darurat) yang memiliki saldo (balance)
- **Financial_Goal**: Entitas yang merepresentasikan tujuan keuangan User dengan target nominal, kategori, dan tenggat waktu opsional
- **Goal_Contribution**: Catatan penambahan atau penarikan dana pada Financial_Goal, yang sekarang mencatat Account sumber/tujuan dana
- **Contribution_Form**: Modal form untuk menambah kontribusi atau menarik dana dari Financial_Goal, yang sekarang menyertakan dropdown pemilihan Account
- **Goal_Detail_View**: Tampilan detail satu Financial_Goal yang menampilkan riwayat kontribusi dan statistik
- **RPC_Function**: Fungsi PostgreSQL yang dieksekusi secara atomik di sisi server (SECURITY DEFINER)
- **Atomic_Operation**: Operasi database yang menjamin perubahan saldo Account dan current_amount pada Financial_Goal terjadi dalam satu transaksi — keduanya berhasil atau keduanya gagal
- **Fund_Allocation**: Pemindahan dana internal dari Account ke Financial_Goal (atau sebaliknya) yang bukan merupakan pengeluaran atau pemasukan
- **RLS**: Row Level Security pada Supabase/PostgreSQL untuk isolasi data per User
- **formatIDR**: Fungsi utilitas yang memformat angka ke format mata uang IDR

## Requirements

### Requirement 1: Pemilihan Account Sumber saat Kontribusi

**User Story:** Sebagai User, saya ingin memilih Account sumber dana saat menambah kontribusi ke Financial_Goal, sehingga saldo Account berkurang secara otomatis dan pencatatan keuangan saya akurat.

#### Acceptance Criteria

1. WHEN User membuka Contribution_Form dalam mode "tambah kontribusi", THE Contribution_Form SHALL menampilkan dropdown "Pilih Akun Sumber" yang berisi semua Account aktif (is_deleted = false) milik User
2. THE Contribution_Form SHALL menampilkan nama Account dan saldo saat ini (dalam format formatIDR) pada setiap opsi di dropdown
3. THE Contribution_Form SHALL mewajibkan User memilih satu Account sumber sebelum kontribusi dapat disimpan
4. IF User belum memilih Account sumber dan menekan tombol simpan, THEN THE Contribution_Form SHALL menampilkan pesan error "Pilih akun sumber terlebih dahulu"
5. IF jumlah kontribusi melebihi saldo Account sumber yang dipilih, THEN THE Contribution_Form SHALL menampilkan pesan error "Saldo akun tidak mencukupi"

### Requirement 2: Operasi Atomik Kontribusi dengan Account

**User Story:** Sebagai User, saya ingin saldo Account sumber berkurang bersamaan dengan bertambahnya current_amount pada Financial_Goal saat kontribusi, sehingga tidak ada inkonsistensi data.

#### Acceptance Criteria

1. WHEN User menyimpan kontribusi yang valid dengan Account sumber yang dipilih, THE RPC_Function SHALL mengurangi saldo Account sumber sebesar jumlah kontribusi dan menambahkan jumlah tersebut ke current_amount pada Financial_Goal dalam satu Atomic_Operation
2. THE RPC_Function SHALL menyimpan account_id pada Goal_Contribution yang dibuat
3. IF Atomic_Operation gagal (misalnya karena constraint violation atau error database), THEN THE RPC_Function SHALL membatalkan seluruh perubahan (rollback) sehingga saldo Account dan current_amount pada Financial_Goal tetap tidak berubah
4. THE RPC_Function SHALL memvalidasi bahwa Account sumber milik User yang sama dengan pemilik Financial_Goal
5. THE RPC_Function SHALL memvalidasi bahwa Account sumber aktif (is_deleted = false)

### Requirement 3: Pemilihan Account Tujuan saat Penarikan

**User Story:** Sebagai User, saya ingin memilih Account tujuan saat menarik dana dari Financial_Goal, sehingga dana dikembalikan ke Account yang saya pilih.

#### Acceptance Criteria

1. WHEN User membuka Contribution_Form dalam mode "tarik dana", THE Contribution_Form SHALL menampilkan dropdown "Pilih Akun Tujuan" yang berisi semua Account aktif (is_deleted = false) milik User
2. THE Contribution_Form SHALL menampilkan nama Account dan saldo saat ini (dalam format formatIDR) pada setiap opsi di dropdown
3. THE Contribution_Form SHALL mewajibkan User memilih satu Account tujuan sebelum penarikan dapat disimpan
4. IF User belum memilih Account tujuan dan menekan tombol simpan, THEN THE Contribution_Form SHALL menampilkan pesan error "Pilih akun tujuan terlebih dahulu"

### Requirement 4: Operasi Atomik Penarikan dengan Account

**User Story:** Sebagai User, saya ingin saldo Account tujuan bertambah bersamaan dengan berkurangnya current_amount pada Financial_Goal saat penarikan, sehingga tidak ada inkonsistensi data.

#### Acceptance Criteria

1. WHEN User menyimpan penarikan yang valid dengan Account tujuan yang dipilih, THE RPC_Function SHALL menambahkan jumlah penarikan ke saldo Account tujuan dan mengurangi jumlah tersebut dari current_amount pada Financial_Goal dalam satu Atomic_Operation
2. THE RPC_Function SHALL menyimpan account_id pada Goal_Contribution yang dibuat (dengan amount negatif)
3. IF Atomic_Operation gagal, THEN THE RPC_Function SHALL membatalkan seluruh perubahan (rollback) sehingga saldo Account dan current_amount pada Financial_Goal tetap tidak berubah
4. THE RPC_Function SHALL memvalidasi bahwa Account tujuan milik User yang sama dengan pemilik Financial_Goal
5. THE RPC_Function SHALL memvalidasi bahwa Account tujuan aktif (is_deleted = false)

### Requirement 5: Pencatatan Account pada Goal Contribution

**User Story:** Sebagai User, saya ingin setiap catatan kontribusi menyimpan informasi Account yang digunakan, sehingga saya dapat melacak dari mana dana berasal atau ke mana dana dikembalikan.

#### Acceptance Criteria

1. THE FinTrack SHALL menyimpan kolom account_id pada tabel goal_contributions yang mereferensikan Account sumber (untuk kontribusi) atau Account tujuan (untuk penarikan)
2. THE Goal_Detail_View SHALL menampilkan nama Account sumber atau tujuan pada setiap item di riwayat Goal_Contribution
3. IF Account yang tercatat pada Goal_Contribution telah dihapus (soft-deleted), THEN THE Goal_Detail_View SHALL tetap menampilkan nama Account tersebut dengan indikator bahwa Account sudah tidak aktif

### Requirement 6: Isolasi dari Laporan Pemasukan/Pengeluaran

**User Story:** Sebagai User, saya ingin kontribusi dan penarikan goal tidak memengaruhi laporan pemasukan dan pengeluaran, sehingga laporan keuangan saya tetap akurat.

#### Acceptance Criteria

1. THE FinTrack SHALL memperlakukan kontribusi dan penarikan goal sebagai Fund_Allocation internal, bukan sebagai Transaction bertipe income atau expense
2. THE FinTrack SHALL memastikan kontribusi dan penarikan goal tidak muncul dalam daftar Transaction pada halaman transaksi
3. THE FinTrack SHALL memastikan kontribusi dan penarikan goal tidak dihitung dalam laporan pemasukan, pengeluaran, atau cash flow pada halaman laporan

### Requirement 7: Skema Database untuk Goal-Account Linking

**User Story:** Sebagai User, saya ingin data linking antara goal dan account tersimpan dengan aman di database, sehingga integritas data terjaga.

#### Acceptance Criteria

1. THE FinTrack SHALL menambahkan kolom account_id (nullable untuk backward compatibility dengan kontribusi lama) pada tabel goal_contributions yang mereferensikan tabel accounts
2. THE RLS SHALL memastikan setiap User hanya dapat membaca dan membuat Goal_Contribution yang merujuk pada Account miliknya sendiri
3. THE FinTrack SHALL memastikan bahwa setelah Atomic_Operation kontribusi, jumlah penurunan saldo Account sumber sama persis dengan jumlah kenaikan current_amount pada Financial_Goal
4. THE FinTrack SHALL memastikan bahwa setelah Atomic_Operation penarikan, jumlah kenaikan saldo Account tujuan sama persis dengan jumlah penurunan current_amount pada Financial_Goal
