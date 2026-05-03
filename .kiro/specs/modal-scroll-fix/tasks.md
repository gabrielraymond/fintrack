# Implementation Plan: Modal Scroll Fix

## Overview

Memperbaiki komponen Modal agar memiliki layout flexbox dengan max-height terbatas dan content area yang scrollable, sehingga action buttons selalu terlihat. Perubahan utama di `src/components/ui/Modal.tsx` dengan penambahan prop `footer` opsional.

## Tasks

- [x] 1. Update komponen Modal dengan layout scrollable
  - [x] 1.1 Tambahkan prop `footer` opsional pada ModalProps interface
    - Tambahkan `footer?: React.ReactNode` ke interface
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 1.2 Update dialog container dengan flex layout dan max-height
    - Tambahkan `flex flex-col max-h-[90vh]` pada dialog container
    - Tambahkan `sm:max-h-[85vh]` untuk responsive mobile
    - _Requirements: 1.1, 1.2, 1.3, 5.1_
  - [x] 1.3 Update content area dengan overflow scroll
    - Ubah `<div className="p-4">` menjadi `<div className="p-4 flex-1 overflow-y-auto min-h-0">`
    - _Requirements: 2.1, 2.3_
  - [x] 1.4 Tambahkan header flex-shrink-0
    - Tambahkan `flex-shrink-0` pada header div agar tidak ikut menyusut
    - _Requirements: 3.3_
  - [x] 1.5 Implementasi footer slot
    - Render footer section dengan `flex-shrink-0 p-4 border-t border-border` ketika prop footer diberikan
    - _Requirements: 2.2, 3.1, 3.2, 3.3_
  - [ ]* 1.6 Write unit tests untuk Modal component yang diupdate
    - Test render dengan dan tanpa footer prop
    - Test class names yang benar diterapkan
    - Test backward compatibility dengan children biasa
    - _Requirements: 4.1, 4.4_

- [x] 2. Migrate AccountStep untuk menggunakan footer slot
  - [x] 2.1 Refactor AccountStep agar memisahkan button "Lanjut" ke footer
    - Pindahkan button confirm ke prop terpisah atau gunakan pattern yang kompatibel dengan Modal footer
    - Pastikan scroll hanya pada daftar akun, button tetap di bawah
    - _Requirements: 4.2_
  - [ ]* 2.2 Write unit test untuk AccountStep dengan banyak akun
    - Verifikasi button "Lanjut" tetap accessible saat banyak akun
    - _Requirements: 4.2_

- [x] 3. Checkpoint - Verifikasi modal dasar berfungsi
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update TransactionModal untuk mendukung footer dari child steps
  - [x] 4.1 Tambahkan mekanisme footer pada TransactionModal
    - Modifikasi TransactionModal agar dapat meneruskan footer dari step components ke Modal
    - _Requirements: 4.1, 4.2_
  - [ ]* 4.2 Write property test: modal height constraint
    - **Property 1: Modal height tidak melebihi viewport**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 4.3 Write property test: content area scrollable saat overflow
    - **Property 2: Content area menjadi scrollable saat overflow**
    - **Validates: Requirements 2.1, 2.3**

- [x] 5. Verifikasi semua modal existing tetap berfungsi
  - [x] 5.1 Verifikasi BudgetForm, CategoryForm, GoalForm, ContributionForm
    - Pastikan semua modal existing render dengan benar tanpa perubahan pada komponen child
    - _Requirements: 4.3, 4.4_
  - [ ]* 5.2 Write property test: backward compatibility
    - **Property 4: Backward compatibility — semua children render dengan benar**
    - **Validates: Requirements 4.1, 4.4**

- [x] 6. Final checkpoint - Pastikan semua tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Perubahan utama hanya di `src/components/ui/Modal.tsx` — semua modal lain otomatis mendapat perbaikan
- Prop `footer` bersifat opsional untuk backward compatibility
- AccountStep dan TransactionModal perlu sedikit refactor untuk memanfaatkan footer slot secara optimal
