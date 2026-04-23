# Dokumen Persyaratan

## Pendahuluan

Dokumen ini mendefinisikan persyaratan untuk dua peningkatan fitur pada aplikasi FinTrack:
1. Kemampuan menambah kategori kustom baru langsung dari halaman pengaturan (saat ini hanya bisa edit dan hapus).
2. Kemampuan mengedit bulan (periode anggaran) saat mengedit anggaran yang sudah ada (saat ini bulan terkunci saat mode edit).

## Glosarium

- **Sistem_Kategori**: Modul yang mengelola kategori transaksi pengguna, termasuk kategori default dan kustom.
- **Formulir_Kategori**: Komponen UI untuk membuat kategori kustom baru dengan nama dan ikon.
- **Sistem_Anggaran**: Modul yang mengelola anggaran bulanan per kategori, termasuk pembuatan, pengeditan, dan penghapusan.
- **Formulir_Anggaran**: Komponen UI modal untuk membuat dan mengedit anggaran.
- **Kategori_Kustom**: Kategori yang dibuat oleh pengguna (bukan kategori default bawaan sistem).
- **Periode_Anggaran**: Bulan dan tahun yang menjadi periode berlakunya suatu anggaran.

## Persyaratan

### Persyaratan 1: Tambah Kategori Kustom Baru

**User Story:** Sebagai pengguna, saya ingin menambah kategori kustom baru dari halaman pengaturan, sehingga saya dapat mengkategorikan transaksi dan anggaran sesuai kebutuhan pribadi saya.

#### Kriteria Penerimaan

1. WHEN pengguna menekan tombol tambah kategori pada halaman pengaturan, THEN Sistem_Kategori SHALL menampilkan Formulir_Kategori dengan field nama dan ikon
2. WHEN pengguna mengisi nama dan ikon lalu menyimpan, THEN Sistem_Kategori SHALL membuat Kategori_Kustom baru dengan is_default bernilai false dan menambahkannya ke daftar kategori
3. WHEN pengguna mencoba menyimpan kategori dengan nama kosong atau hanya spasi, THEN Sistem_Kategori SHALL menolak penyimpanan dan menampilkan pesan validasi
4. WHEN Kategori_Kustom baru berhasil dibuat, THEN Sistem_Kategori SHALL menampilkan kategori tersebut di daftar kategori pada halaman pengaturan
5. IF pembuatan kategori gagal karena kesalahan jaringan atau server, THEN Sistem_Kategori SHALL menampilkan pesan error dan memungkinkan pengguna mencoba kembali

### Persyaratan 2: Edit Periode Bulan pada Anggaran

**User Story:** Sebagai pengguna, saya ingin dapat mengedit bulan (periode) anggaran yang sudah ada, sehingga saya dapat memindahkan anggaran ke bulan yang berbeda jika terjadi kesalahan input.

#### Kriteria Penerimaan

1. WHEN pengguna membuka Formulir_Anggaran dalam mode edit, THEN Sistem_Anggaran SHALL menampilkan field bulan dalam keadaan dapat diedit (tidak terkunci)
2. WHEN pengguna mengubah Periode_Anggaran pada anggaran yang sudah ada, THEN Sistem_Anggaran SHALL memperbarui bulan anggaran tersebut di database
3. WHEN pengguna mengubah Periode_Anggaran ke bulan yang sudah memiliki anggaran untuk kategori yang sama, THEN Sistem_Anggaran SHALL menolak perubahan dan menampilkan pesan bahwa anggaran untuk kategori dan bulan tersebut sudah ada
4. WHEN Periode_Anggaran berhasil diubah, THEN Sistem_Anggaran SHALL menghitung ulang pengeluaran (spent) berdasarkan transaksi di bulan baru tersebut
5. IF pembaruan Periode_Anggaran gagal karena kesalahan jaringan atau server, THEN Sistem_Anggaran SHALL menampilkan pesan error dan memungkinkan pengguna mencoba kembali
