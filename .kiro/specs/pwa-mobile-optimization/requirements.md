# Requirements Document

## Introduction

Fitur PWA & Mobile Optimization mengubah FinTrack menjadi Progressive Web App (PWA) yang dapat diinstal dan terasa seperti aplikasi native di perangkat mobile. Fitur ini mengatasi dua masalah utama: (1) masalah viewport di mobile — halaman auto-zoom saat navigasi dan input focus, layout tidak memanfaatkan ruang layar secara efisien, dan (2) aplikasi belum bisa diinstal ke home screen — saat disimpan ke home screen, masih menampilkan chrome browser alih-alih tampilan standalone seperti aplikasi native. Perubahan meliputi konfigurasi viewport, web app manifest, meta tag PWA, service worker untuk installability, ikon aplikasi, dukungan safe area inset untuk perangkat bernotch, dan penyesuaian CSS untuk efisiensi ruang layar.

## Glossary

- **FinTrack**: Aplikasi keuangan pribadi yang sedang dispesifikasikan
- **PWA**: Progressive Web App — teknologi web yang memungkinkan aplikasi web diinstal dan berjalan seperti aplikasi native
- **Viewport**: Area tampilan yang terlihat oleh pengguna di browser, dikontrol oleh meta tag viewport
- **Manifest**: File JSON (manifest.json) yang mendeskripsikan metadata aplikasi PWA seperti nama, ikon, warna tema, dan mode tampilan
- **Service_Worker**: Script JavaScript yang berjalan di background browser, memungkinkan fitur seperti caching offline dan installability
- **Standalone_Mode**: Mode tampilan PWA di mana browser chrome (address bar, tab bar) disembunyikan sehingga aplikasi terlihat seperti native
- **Safe_Area_Inset**: Area aman pada perangkat bernotch (seperti iPhone dengan Dynamic Island) yang harus dihindari oleh konten UI
- **BottomNav**: Komponen navigasi bawah yang ditampilkan di tampilan mobile (tersembunyi di desktop)
- **Root_Layout**: File `src/app/layout.tsx` yang merupakan layout utama aplikasi Next.js
- **Theme_Color**: Warna tema aplikasi yang digunakan oleh browser dan OS untuk mewarnai status bar dan UI chrome
- **Home_Screen**: Layar utama perangkat mobile tempat ikon aplikasi ditampilkan
- **Browser_Chrome**: Elemen UI browser seperti address bar, tab bar, dan tombol navigasi
- **Content_Container**: Elemen wrapper pada setiap halaman yang menggunakan class `max-w-3xl mx-auto` untuk membatasi lebar konten

## Requirements

### Requirement 1: Konfigurasi Viewport untuk Mencegah Auto-Zoom

**User Story:** Sebagai User mobile, saya ingin halaman tidak auto-zoom saat navigasi atau fokus input, sehingga pengalaman browsing terasa stabil dan konsisten.

#### Acceptance Criteria

1. THE Root_Layout SHALL mengekspor konfigurasi viewport Next.js dengan properti `width: 'device-width'`, `initialScale: 1`, dan `viewportFit: 'cover'`
2. WHEN User memfokuskan elemen input, textarea, atau select di perangkat mobile, THE FinTrack SHALL menampilkan elemen tersebut tanpa memicu auto-zoom oleh browser
3. THE FinTrack SHALL menetapkan `font-size` minimum 16px pada semua elemen input, textarea, dan select melalui CSS global untuk mencegah auto-zoom pada iOS Safari

### Requirement 2: Web App Manifest untuk Installability

**User Story:** Sebagai User mobile, saya ingin menginstal FinTrack ke home screen, sehingga saya dapat mengaksesnya seperti aplikasi native tanpa membuka browser.

#### Acceptance Criteria

1. THE FinTrack SHALL menyediakan file manifest di `public/manifest.json` yang berisi field `name`, `short_name`, `description`, `start_url`, `display`, `theme_color`, `background_color`, dan `icons`
2. THE Manifest SHALL menetapkan field `display` bernilai `standalone` sehingga aplikasi berjalan tanpa Browser_Chrome
3. THE Manifest SHALL menetapkan field `start_url` bernilai `/` sehingga aplikasi selalu dimulai dari halaman utama
4. THE Manifest SHALL menyertakan minimal dua ikon: satu berukuran 192x192 piksel dan satu berukuran 512x512 piksel, keduanya dalam format PNG
5. THE Manifest SHALL menetapkan `theme_color` dan `background_color` yang konsisten dengan warna tema hijau FinTrack (`#628141` untuk light mode)
6. THE Root_Layout SHALL menautkan file manifest melalui metadata Next.js

### Requirement 3: Meta Tag PWA untuk Kompatibilitas iOS dan Android

**User Story:** Sebagai User mobile, saya ingin aplikasi yang diinstal ke home screen menampilkan status bar dan splash screen yang sesuai dengan tema FinTrack, sehingga pengalaman terasa native.

#### Acceptance Criteria

1. THE Root_Layout SHALL menyertakan meta tag `theme-color` dengan nilai yang sesuai dengan warna tema FinTrack
2. THE Root_Layout SHALL menyertakan meta tag `apple-mobile-web-app-capable` dengan nilai `yes`
3. THE Root_Layout SHALL menyertakan meta tag `apple-mobile-web-app-status-bar-style` dengan nilai `default`
4. THE Root_Layout SHALL menyertakan link `apple-touch-icon` yang mengarah ke ikon berukuran 180x180 piksel

### Requirement 4: Service Worker untuk Offline Support dan Installability

**User Story:** Sebagai User, saya ingin FinTrack memenuhi kriteria installability PWA, sehingga browser menampilkan prompt "Add to Home Screen" dan aplikasi memiliki dukungan offline dasar.

#### Acceptance Criteria

1. THE FinTrack SHALL mendaftarkan Service_Worker saat aplikasi dimuat di browser
2. THE Service_Worker SHALL melakukan caching pada asset statis (HTML shell, CSS, JavaScript, ikon) menggunakan strategi cache-first
3. WHEN perangkat tidak memiliki koneksi internet, THE Service_Worker SHALL menyajikan halaman offline fallback yang menginformasikan User bahwa koneksi diperlukan
4. THE next.config.mjs SHALL dikonfigurasi untuk mendukung generasi Service_Worker menggunakan package `next-pwa` atau pendekatan custom yang kompatibel dengan Next.js 14

### Requirement 5: Dukungan Safe Area Inset untuk Perangkat Bernotch

**User Story:** Sebagai User dengan perangkat bernotch (seperti iPhone dengan Dynamic Island), saya ingin konten dan navigasi tidak tertutup oleh notch atau home indicator, sehingga semua elemen UI dapat diakses.

#### Acceptance Criteria

1. THE BottomNav SHALL menerapkan padding-bottom menggunakan `env(safe-area-inset-bottom)` sehingga navigasi tidak tertutup oleh home indicator
2. THE Root_Layout SHALL mengaktifkan dukungan safe area melalui viewport-fit `cover` pada konfigurasi viewport
3. WHEN aplikasi berjalan dalam Standalone_Mode pada perangkat bernotch, THE FinTrack SHALL memastikan konten utama tidak tertutup oleh safe area inset di semua sisi

### Requirement 6: Optimasi Efisiensi Ruang Layar

**User Story:** Sebagai User, saya ingin konten halaman memanfaatkan ruang layar secara efisien di semua ukuran perangkat, sehingga tidak ada ruang yang terbuang.

#### Acceptance Criteria

1. THE Content_Container pada semua halaman protected SHALL menggunakan lebar maksimum yang lebih besar dari 768px (saat ini `max-w-3xl`) pada layar desktop, sehingga konten memanfaatkan ruang yang tersedia
2. THE Content_Container SHALL tetap responsif dan terbaca pada layar mobile tanpa horizontal scrolling
3. WHEN aplikasi ditampilkan pada layar desktop dengan lebar lebih dari 1024px, THE Content_Container SHALL menggunakan lebar maksimum yang proporsional dengan ruang yang tersedia

### Requirement 7: Ikon Aplikasi untuk Home Screen

**User Story:** Sebagai User, saya ingin FinTrack memiliki ikon yang jelas dan representatif saat diinstal ke home screen, sehingga mudah dikenali di antara aplikasi lain.

#### Acceptance Criteria

1. THE FinTrack SHALL menyediakan file ikon PNG berukuran 192x192 piksel di direktori `public/icons/`
2. THE FinTrack SHALL menyediakan file ikon PNG berukuran 512x512 piksel di direktori `public/icons/`
3. THE FinTrack SHALL menyediakan file ikon PNG berukuran 180x180 piksel di direktori `public/icons/` untuk digunakan sebagai `apple-touch-icon`
4. THE ikon SHALL menggunakan warna hijau primer FinTrack (`#628141`) sebagai warna dominan dengan huruf "F" atau simbol keuangan yang mudah dikenali
