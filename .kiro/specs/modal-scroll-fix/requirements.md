# Dokumen Persyaratan

## Pendahuluan

Fitur ini memperbaiki masalah UX pada komponen Modal di aplikasi FinTrack, di mana konten modal (terutama pada modal transfer dengan banyak akun) meluap dan menutupi tombol save/submit. Perbaikan ini memastikan semua modal memiliki area konten yang dapat di-scroll dengan tombol aksi yang selalu terlihat di bagian bawah.

## Glosarium

- **Modal**: Komponen dialog overlay yang menampilkan form atau konten interaktif di atas halaman utama
- **Content_Area**: Area di dalam Modal yang menampilkan konten utama (form, daftar, dll)
- **Action_Buttons**: Tombol-tombol aksi di bagian bawah modal (simpan, submit, batal, dll)
- **Viewport**: Area layar yang terlihat oleh pengguna
- **Max_Height**: Batas tinggi maksimum yang diterapkan pada modal agar tidak melebihi viewport

## Persyaratan

### Persyaratan 1: Modal Memiliki Batas Tinggi Maksimum

**User Story:** Sebagai pengguna, saya ingin modal tidak melebihi tinggi layar, sehingga saya selalu dapat melihat seluruh modal tanpa harus scroll halaman utama.

#### Acceptance Criteria

1. THE Modal SHALL memiliki max-height yang tidak melebihi 90% dari tinggi viewport
2. WHILE konten modal melebihi max-height, THE Modal SHALL mempertahankan dimensinya tanpa melebihi batas viewport
3. WHEN modal dibuka pada perangkat mobile, THE Modal SHALL menyesuaikan max-height dengan tinggi layar perangkat

### Persyaratan 2: Area Konten Dapat Di-scroll

**User Story:** Sebagai pengguna, saya ingin dapat men-scroll konten modal ketika kontennya panjang, sehingga saya dapat melihat semua opsi yang tersedia.

#### Acceptance Criteria

1. WHEN konten Content_Area melebihi ruang yang tersedia, THE Content_Area SHALL menampilkan scroll vertikal
2. WHILE pengguna men-scroll Content_Area, THE Action_Buttons SHALL tetap terlihat dan tidak ikut ter-scroll
3. THE Content_Area SHALL menggunakan overflow-y auto sehingga scrollbar hanya muncul ketika diperlukan

### Persyaratan 3: Tombol Aksi Selalu Terlihat

**User Story:** Sebagai pengguna, saya ingin tombol simpan/submit selalu terlihat di bagian bawah modal, sehingga saya tidak perlu scroll ke bawah untuk menemukan tombol tersebut.

#### Acceptance Criteria

1. THE Action_Buttons SHALL selalu terlihat di bagian bawah modal tanpa perlu scroll
2. WHEN Content_Area memiliki konten yang panjang, THE Action_Buttons SHALL tetap berada di posisi fixed di bagian bawah modal
3. THE Modal SHALL memisahkan area header, Content_Area yang scrollable, dan Action_Buttons secara visual dengan border atau separator

### Persyaratan 4: Perbaikan Diterapkan pada Semua Modal

**User Story:** Sebagai pengguna, saya ingin semua modal di aplikasi memiliki perilaku scroll yang konsisten, sehingga pengalaman penggunaan aplikasi seragam di semua fitur.

#### Acceptance Criteria

1. THE Modal SHALL menerapkan layout scrollable secara default untuk semua instance modal di aplikasi
2. WHEN modal transfer dibuka dengan banyak akun, THE Content_Area SHALL dapat di-scroll dan Action_Buttons tetap terlihat
3. WHEN modal budget, kategori, atau goal dibuka dengan konten panjang, THE Content_Area SHALL dapat di-scroll dan Action_Buttons tetap terlihat
4. THE Modal SHALL mempertahankan kompatibilitas dengan semua modal yang sudah ada tanpa memerlukan perubahan pada komponen child

### Persyaratan 5: Responsivitas pada Mobile

**User Story:** Sebagai pengguna mobile, saya ingin modal tetap nyaman digunakan pada layar kecil, sehingga saya dapat mengisi form dan menekan tombol submit tanpa kesulitan.

#### Acceptance Criteria

1. WHEN modal dibuka pada layar mobile (lebar < 640px), THE Modal SHALL menggunakan hampir seluruh tinggi layar yang tersedia
2. WHILE pengguna menggunakan perangkat mobile, THE Content_Area SHALL memiliki area scroll yang cukup besar untuk navigasi konten
3. IF keyboard virtual muncul pada perangkat mobile, THEN THE Modal SHALL menyesuaikan layout agar Action_Buttons tetap terlihat di atas keyboard
