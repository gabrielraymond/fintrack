# Requirements Document

## Pendahuluan

Fitur ini menambahkan pelacakan profit/loss (keuntungan/kerugian) untuk akun investasi. User secara manual memperbarui nilai portofolio saat ini (balance) dan total modal yang telah disetor (invested_amount). Sistem menghitung P/L sebagai selisih antara balance dan invested_amount, lalu menampilkannya di UI dengan warna hijau (untung) atau merah (rugi).

Fitur ini mengikuti pola yang sudah ada pada akun emas (gold) yang menampilkan P/L berdasarkan harga beli vs harga buyback, namun lebih sederhana karena tidak memerlukan integrasi harga live.

## Glossary

- **Sistem**: Aplikasi FinTrack (Next.js + Supabase)
- **Akun_Investasi**: Akun dengan tipe `investment` yang merepresentasikan satu platform/portofolio (contoh: "Pluang - Crypto", "Stockbit - Long Term")
- **Balance**: Nilai portofolio saat ini yang diinput manual oleh user
- **Invested_Amount**: Total modal yang telah disetor ke platform investasi (modal awal + top-up - penarikan)
- **Profit_Loss**: Selisih antara Balance dan Invested_Amount (Balance - Invested_Amount)
- **Profit_Loss_Percentage**: Persentase keuntungan/kerugian dihitung sebagai (Profit_Loss / Invested_Amount) × 100
- **AccountCard**: Komponen UI yang menampilkan informasi satu akun
- **AccountSummaryStrip**: Komponen UI horizontal scrollable yang menampilkan ringkasan akun di dashboard
- **AccountForm**: Modal form untuk membuat atau mengedit akun

## Requirements

### Requirement 1: Penyimpanan Data Modal Investasi

**User Story:** Sebagai user, saya ingin menyimpan total modal yang telah saya setor ke platform investasi, sehingga sistem dapat menghitung profit/loss saya.

#### Acceptance Criteria

1. THE Sistem SHALL menyimpan field `invested_amount` (BIGINT, nullable) pada tabel accounts di database
2. WHEN Akun_Investasi dibuat atau diedit, THE AccountForm SHALL menampilkan field input "Modal Investasi" untuk mengisi invested_amount
3. WHEN tipe akun bukan `investment`, THE AccountForm SHALL menyembunyikan field "Modal Investasi"
4. WHEN invested_amount tidak diisi, THE Sistem SHALL menyimpan nilai null untuk field tersebut

### Requirement 2: Perhitungan Profit/Loss

**User Story:** Sebagai user, saya ingin melihat berapa keuntungan atau kerugian investasi saya, sehingga saya dapat memantau performa portofolio.

#### Acceptance Criteria

1. WHEN Akun_Investasi memiliki balance dan invested_amount yang valid (bukan null dan invested_amount > 0), THE Sistem SHALL menghitung Profit_Loss sebagai balance dikurangi invested_amount
2. WHEN Akun_Investasi memiliki balance dan invested_amount yang valid (bukan null dan invested_amount > 0), THE Sistem SHALL menghitung Profit_Loss_Percentage sebagai (Profit_Loss / Invested_Amount) × 100
3. WHEN invested_amount bernilai null atau 0, THE Sistem SHALL tidak menampilkan informasi Profit_Loss
4. WHEN Profit_Loss bernilai positif, THE Sistem SHALL menampilkan nilai dengan warna hijau dan prefix "+"
5. WHEN Profit_Loss bernilai negatif, THE Sistem SHALL menampilkan nilai dengan warna merah
6. WHEN Profit_Loss bernilai nol, THE Sistem SHALL menampilkan nilai dengan warna hijau dan prefix "+"

### Requirement 3: Tampilan P/L di AccountCard

**User Story:** Sebagai user, saya ingin melihat profit/loss di kartu akun investasi, sehingga saya dapat dengan cepat melihat performa setiap portofolio.

#### Acceptance Criteria

1. WHEN AccountCard menampilkan Akun_Investasi dengan invested_amount valid, THE AccountCard SHALL menampilkan Profit_Loss dalam format mata uang IDR
2. WHEN AccountCard menampilkan Akun_Investasi dengan invested_amount valid, THE AccountCard SHALL menampilkan Profit_Loss_Percentage dalam format persentase
3. WHEN AccountCard menampilkan Akun_Investasi tanpa invested_amount, THE AccountCard SHALL hanya menampilkan balance tanpa informasi P/L

### Requirement 4: Tampilan P/L di AccountSummaryStrip

**User Story:** Sebagai user, saya ingin melihat ringkasan profit/loss investasi di dashboard, sehingga saya mendapat gambaran cepat performa investasi.

#### Acceptance Criteria

1. WHEN AccountSummaryStrip menampilkan Akun_Investasi dengan invested_amount valid, THE AccountSummaryStrip SHALL menampilkan balance sebagai nilai utama dan Profit_Loss di bawahnya
2. WHEN AccountSummaryStrip menampilkan Akun_Investasi tanpa invested_amount, THE AccountSummaryStrip SHALL hanya menampilkan balance

### Requirement 5: Update Modal saat Top-up atau Penarikan

**User Story:** Sebagai user, saya ingin memperbarui invested_amount ketika saya menambah modal atau menarik dana, sehingga perhitungan P/L tetap akurat.

#### Acceptance Criteria

1. WHEN user mengedit Akun_Investasi, THE AccountForm SHALL menampilkan field invested_amount yang dapat diubah
2. WHEN user menambah modal (top-up), THE Sistem SHALL memungkinkan user menaikkan nilai invested_amount
3. WHEN user menarik dana (withdrawal), THE Sistem SHALL memungkinkan user menurunkan nilai invested_amount
4. IF invested_amount diisi dengan nilai negatif, THEN THE Sistem SHALL menolak input dan menampilkan pesan error

### Requirement 6: Integrasi dengan Tipe Data yang Ada

**User Story:** Sebagai developer, saya ingin fitur ini terintegrasi dengan arsitektur yang sudah ada, sehingga tidak merusak fungsionalitas existing.

#### Acceptance Criteria

1. THE Sistem SHALL menambahkan field `invested_amount: number | null` pada interface Account di TypeScript
2. THE Sistem SHALL menambahkan field `invested_amount` pada interface AccountFormInput
3. WHEN migrasi database dijalankan, THE Sistem SHALL menambahkan kolom `invested_amount` tanpa mengubah data akun yang sudah ada
4. WHEN akun bukan tipe `investment`, THE Sistem SHALL mengabaikan field invested_amount
