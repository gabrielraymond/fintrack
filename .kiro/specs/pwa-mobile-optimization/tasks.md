# Implementation Plan: PWA & Mobile Optimization

## Overview

Implementasi bertahap untuk mengubah FinTrack menjadi PWA yang dapat diinstal dan mengoptimalkan tampilan mobile. Dimulai dari konfigurasi viewport dan manifest (inti PWA), lalu service worker, ikon, CSS adjustments, dan terakhir content container width.

## Tasks

- [x] 1. Konfigurasi viewport dan metadata PWA di Root Layout
  - [x] 1.1 Tambahkan export `viewport` di `src/app/layout.tsx` dengan `width: 'device-width'`, `initialScale: 1`, `maximumScale: 1`, `userScalable: false`, `viewportFit: 'cover'`
    - Import `Viewport` type dari `next`
    - Export `viewport` sebagai named export terpisah dari `metadata`
    - _Requirements: 1.1, 5.2_
  - [x] 1.2 Update export `metadata` di `src/app/layout.tsx` dengan properti PWA
    - Tambahkan `manifest: '/manifest.json'`
    - Tambahkan `themeColor` array untuk light dan dark mode
    - Tambahkan `appleWebApp: { capable: true, statusBarStyle: 'default', title: 'FinTrack' }`
    - Tambahkan `icons` dengan entry untuk 192x192, 512x512, dan apple-touch-icon
    - Tambahkan `other: { 'mobile-web-app-capable': 'yes' }`
    - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Buat web app manifest dan halaman offline
  - [x] 2.1 Buat file `public/manifest.json` dengan semua field wajib PWA
    - `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `orientation: "portrait"`
    - `theme_color: "#628141"`, `background_color: "#F5F2EB"`
    - Array `icons` dengan entry 192x192 dan 512x512 (purpose: "any maskable")
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 Buat file `public/offline.html` sebagai halaman offline fallback
    - HTML statis sederhana dengan pesan "Anda sedang offline" dalam Bahasa Indonesia
    - Styling inline yang konsisten dengan tema FinTrack
    - _Requirements: 4.3_
  - [ ]* 2.3 Tulis unit test untuk validasi manifest.json
    - Parse `public/manifest.json` dan verifikasi semua field wajib ada dan bernilai benar
    - **Property 1: Manifest berisi semua field wajib PWA**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 3. Buat ikon aplikasi
  - [x] 3.1 Buat ikon PWA di `public/icons/`
    - Buat `icon-192x192.png` (192x192 piksel)
    - Buat `icon-512x512.png` (512x512 piksel)
    - Buat `apple-touch-icon.png` (180x180 piksel)
    - Desain: latar belakang hijau `#628141` dengan huruf "F" putih di tengah
    - Bisa menggunakan script Node.js dengan canvas atau SVG-to-PNG conversion
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Checkpoint - Verifikasi konfigurasi dasar PWA
  - Ensure all tests pass, ask the user if questions arise.
  - Verifikasi manifest.json valid, metadata dan viewport export benar, ikon ada

- [x] 5. Konfigurasi service worker dengan next-pwa
  - [x] 5.1 Install package `next-pwa` dan konfigurasi `next.config.mjs`
    - `npm install next-pwa`
    - Wrap nextConfig dengan `withPWA()` dari `next-pwa`
    - Set `dest: 'public'`, `register: true`, `skipWaiting: true`
    - Set `disable: process.env.NODE_ENV === 'development'` untuk disable di dev
    - Set `fallbacks: { document: '/offline.html' }`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.2 Tambahkan file yang dihasilkan next-pwa ke `.gitignore`
    - Tambahkan `public/sw.js`, `public/workbox-*.js`, `public/sw.js.map` ke `.gitignore`
    - _Requirements: 4.4_

- [x] 6. CSS adjustments untuk mobile optimization
  - [x] 6.1 Tambahkan aturan `font-size: 16px` pada input, textarea, select di `src/app/globals.css`
    - Tambahkan ke rule yang sudah ada untuk `input, textarea, select`
    - Ini mencegah auto-zoom pada iOS Safari saat fokus input
    - _Requirements: 1.3_
  - [x] 6.2 Update content container width pada semua halaman protected dari `max-w-3xl` menjadi `max-w-5xl`
    - Update `src/app/(protected)/dashboard/page.tsx`
    - Update `src/app/(protected)/transactions/page.tsx`
    - Update `src/app/(protected)/budgets/page.tsx`
    - Update `src/app/(protected)/accounts/page.tsx`
    - Update `src/app/(protected)/goals/page.tsx`
    - Update `src/app/(protected)/reports/page.tsx`
    - Update `src/app/(protected)/settings/page.tsx`
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]* 6.3 Tulis test untuk verifikasi content container width pada semua halaman protected
    - Baca semua file halaman protected dan verifikasi menggunakan `max-w-5xl`
    - **Property 2: Semua halaman protected menggunakan content container yang lebih lebar**
    - **Validates: Requirements 6.1, 6.3**

- [x] 7. Final checkpoint - Verifikasi keseluruhan PWA setup
  - Ensure all tests pass, ask the user if questions arise.
  - Verifikasi build berhasil tanpa error
  - Rekomendasikan user untuk test manual: buka di mobile browser, cek "Add to Home Screen" prompt, verifikasi standalone mode

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Ikon bisa dibuat sebagai placeholder sederhana dan diganti nanti dengan desain profesional
- Service worker di-disable di development mode untuk menghindari caching issues
- Setelah implementasi, user perlu melakukan `npm run build` untuk menghasilkan service worker
- Test manual di perangkat mobile sangat direkomendasikan untuk memverifikasi pengalaman PWA
