# Design Document: Pemisahan Akun (Account Separation)

## Overview

Fitur ini menerapkan prinsip "bucket system" di FinTrack dengan mengklasifikasikan tipe akun yang sudah ada ke dalam dua kelompok: operasional (aktif bertransaksi) dan simpanan/investasi (uang "diparkir"). Perubahan bersifat murni frontend — tidak ada perubahan skema database, API, atau tipe akun baru. Klasifikasi didefinisikan secara terpusat di satu utilitas, lalu dikonsumsi oleh komponen dashboard, halaman akun, dan modal transaksi.

## Architecture

### Pendekatan Umum

Perubahan mengikuti arsitektur yang sudah ada di FinTrack (Next.js App Router + React hooks + Supabase). Satu file utilitas baru (`src/lib/accountClassifier.ts`) menjadi sumber kebenaran tunggal (single source of truth) untuk klasifikasi akun. Komponen-komponen yang terpengaruh mengimpor utilitas ini untuk memfilter dan mengelompokkan akun.

### Alur Data

```mermaid
graph TD
    A[useAccounts hook] --> B[Account[]]
    B --> C[accountClassifier]
    C --> D[Operational Accounts]
    C --> E[Savings Accounts]
    D --> F[NetWorthCard - Saldo Operasional]
    E --> G[NetWorthCard - Saldo Simpanan]
    D --> H[AccountSummaryStrip - Operasional]
    E --> I[AccountSummaryStrip - Simpanan]
    D --> J[AccountStep - expense/income filter]
    B --> K[AccountStep - transfer, semua akun]
    D --> L[Accounts Page - bagian reguler]
    E --> M[Accounts Page - bagian simpanan]
```

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `src/lib/accountClassifier.ts` | **Baru** — utilitas klasifikasi |
| `src/hooks/useNetWorth.ts` | Tambah perhitungan saldo per kelompok |
| `src/components/dashboard/NetWorthCard.tsx` | Tampilkan 3 nilai (total, operasional, simpanan) |
| `src/components/dashboard/AccountSummaryStrip.tsx` | Tambah prop label bagian |
| `src/app/(protected)/dashboard/page.tsx` | Pisahkan strip menjadi dua, update NetWorthCard props |
| `src/components/transactions/TransactionModal/AccountStep.tsx` | Filter akun berdasarkan tipe transaksi |
| `src/app/(protected)/accounts/page.tsx` | Pindahkan `investment` ke bagian simpanan |

## Components and Interfaces

### 1. Account Classifier (`src/lib/accountClassifier.ts`)

```typescript
import type { Account, AccountType } from '@/types';

/** Tipe akun yang aktif bertransaksi sehari-hari */
export const OPERATIONAL_ACCOUNT_TYPES: ReadonlyArray<AccountType> = [
  'bank', 'e-wallet', 'cash', 'credit_card',
] as const;

/** Tipe akun simpanan & investasi */
export const SAVINGS_ACCOUNT_TYPES: ReadonlyArray<AccountType> = [
  'tabungan', 'dana_darurat', 'investment',
] as const;

export type AccountClassification = 'operational' | 'savings';

/** Mengembalikan klasifikasi untuk satu AccountType */
export function classifyAccountType(type: AccountType): AccountClassification {
  if ((OPERATIONAL_ACCOUNT_TYPES as readonly string[]).includes(type)) {
    return 'operational';
  }
  return 'savings';
}

/** Memisahkan daftar akun menjadi operasional dan simpanan */
export function partitionAccounts(accounts: Account[]): {
  operational: Account[];
  savings: Account[];
} {
  const operational: Account[] = [];
  const savings: Account[] = [];
  for (const account of accounts) {
    if (classifyAccountType(account.type) === 'operational') {
      operational.push(account);
    } else {
      savings.push(account);
    }
  }
  return { operational, savings };
}

/** Menghitung total saldo dari daftar akun (mengecualikan soft-deleted) */
export function sumBalance(accounts: Account[]): number {
  return accounts
    .filter((a) => !a.is_deleted)
    .reduce((sum, a) => sum + a.balance, 0);
}
```

### 2. Updated useNetWorth Hook

```typescript
export interface NetWorthBreakdown {
  total: number;
  operational: number;
  savings: number;
}

export function calculateNetWorthBreakdown(accounts: Account[]): NetWorthBreakdown {
  const active = accounts.filter((a) => !a.is_deleted);
  const { operational, savings } = partitionAccounts(active);
  return {
    total: sumBalance(active),
    operational: sumBalance(operational),
    savings: sumBalance(savings),
  };
}
```

### 3. Updated NetWorthCard Props

```typescript
export interface NetWorthCardProps {
  total: number;
  operational: number;
  savings: number;
}
```

NetWorthCard menampilkan `total` sebagai nilai utama (besar), lalu `operational` dan `savings` sebagai dua nilai sekunder berdampingan di bawahnya.

### 4. Updated AccountSummaryStrip Props

```typescript
export interface AccountSummaryStripProps {
  accounts: Account[];
  label?: string;  // label bagian opsional, ditampilkan di atas strip
}
```

### 5. Updated AccountStep

AccountStep menerima prop `transactionType` yang sudah ada via `isTransfer`. Logika filter:

```typescript
// Di dalam AccountStep
const displayedAccounts = useMemo(() => {
  if (isTransfer) return accounts; // transfer: semua akun
  // expense/income: hanya operasional
  return accounts.filter(
    (a) => classifyAccountType(a.type) === 'operational'
  );
}, [accounts, isTransfer]);
```

### 6. Updated Accounts Page

Mengubah filter `savingsAccounts` dari hanya `tabungan | dana_darurat` menjadi menggunakan `partitionAccounts`, sehingga `investment` masuk ke bagian simpanan. Label bagian diubah menjadi "Tabungan, Investasi & Dana Darurat".

## Data Models

Tidak ada perubahan data model. Fitur ini sepenuhnya menggunakan interface `Account` dan type `AccountType` yang sudah ada. Klasifikasi dilakukan di runtime melalui utilitas `accountClassifier` tanpa menyimpan data tambahan.

### Mapping Klasifikasi

| AccountType | Klasifikasi | Keterangan |
|-------------|-------------|------------|
| `bank` | Operational | Rekening bank aktif |
| `e-wallet` | Operational | Dompet digital (GoPay, OVO, dll) |
| `cash` | Operational | Uang tunai |
| `credit_card` | Operational | Kartu kredit |
| `tabungan` | Savings | Tabungan berjangka |
| `dana_darurat` | Savings | Dana darurat |
| `investment` | Savings | Investasi (reksadana, saham, dll) |


## Correctness Properties

*Correctness property adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi valid dari sebuah sistem — pada dasarnya, pernyataan formal tentang apa yang seharusnya dilakukan sistem. Property berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi mesin.*

### Property 1: Partisi akun lengkap dan benar

*For any* daftar Account, ketika `partitionAccounts` dipanggil, jumlah akun di list `operational` ditambah jumlah akun di list `savings` harus sama dengan jumlah total akun input. Selain itu, setiap akun di list `operational` harus memiliki tipe yang termasuk dalam `OPERATIONAL_ACCOUNT_TYPES`, dan setiap akun di list `savings` harus memiliki tipe yang termasuk dalam `SAVINGS_ACCOUNT_TYPES`.

**Validates: Requirements 1.4, 1.1, 1.2**

### Property 2: Invariant net worth breakdown

*For any* daftar Account, hasil `calculateNetWorthBreakdown` harus memenuhi: `total === operational + savings`. Nilai `operational` harus sama dengan jumlah `balance` dari semua akun non-deleted yang bertipe operasional, dan nilai `savings` harus sama dengan jumlah `balance` dari semua akun non-deleted yang bertipe simpanan. Akun yang di-soft-delete tidak boleh berkontribusi ke nilai manapun.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 3: Filter akun transaksi berdasarkan tipe

*For any* daftar Account dan tipe transaksi, ketika tipe transaksi adalah `expense` atau `income`, daftar akun yang ditampilkan harus hanya berisi Operational_Account. Ketika tipe transaksi adalah `transfer`, daftar akun yang ditampilkan harus berisi semua akun (tidak ada yang difilter).

**Validates: Requirements 4.1, 4.2**

## Error Handling

### Daftar Akun Kosong

- Jika tidak ada Operational_Account aktif dan tipe transaksi expense/income, AccountStep menampilkan pesan: "Tidak ada akun operasional. Buat akun bank, e-wallet, tunai, atau kartu kredit terlebih dahulu."
- Jika tidak ada akun sama sekali, NetWorthCard menampilkan semua nilai sebagai Rp 0.
- AccountSummaryStrip tidak dirender jika daftar akun untuk kelompok tersebut kosong.

### Saldo Negatif

- Saldo negatif (misalnya kartu kredit) ditangani secara natural — nilai negatif tetap dijumlahkan dan ditampilkan dengan warna merah.
- Tidak ada validasi khusus karena saldo negatif adalah kondisi valid (hutang kartu kredit).

### Backward Compatibility

- Tidak ada breaking change karena `AccountType` union type tidak berubah.
- Komponen yang sudah ada tetap menerima props yang sama atau props yang diperluas (backward compatible).

## Testing Strategy

### Unit Tests

Unit test fokus pada contoh spesifik dan edge case:

- **accountClassifier**: Verifikasi setiap AccountType diklasifikasikan dengan benar (7 tipe × 1 test = 7 assertions)
- **partitionAccounts**: Test dengan daftar kosong, daftar hanya operasional, daftar hanya simpanan, daftar campuran
- **calculateNetWorthBreakdown**: Test dengan saldo positif, negatif, nol, dan akun soft-deleted
- **NetWorthCard**: Render test memverifikasi 3 nilai dan label ditampilkan
- **AccountStep**: Render test memverifikasi filter berdasarkan tipe transaksi
- **Accounts Page**: Render test memverifikasi pengelompokan dan label bagian

### Property-Based Tests

Property-based test menggunakan library **fast-check** (sudah umum di ekosistem TypeScript/React). Setiap test dijalankan minimal 100 iterasi.

- **Property 1** — Generate daftar Account acak dengan tipe acak, panggil `partitionAccounts`, verifikasi completeness dan correctness.
  - Tag: `Feature: account-separation, Property 1: Partisi akun lengkap dan benar`
- **Property 2** — Generate daftar Account acak (termasuk soft-deleted dan saldo negatif), panggil `calculateNetWorthBreakdown`, verifikasi invariant `total === operational + savings` dan exclusion soft-deleted.
  - Tag: `Feature: account-separation, Property 2: Invariant net worth breakdown`
- **Property 3** — Generate daftar Account acak dan tipe transaksi acak, terapkan filter, verifikasi hasil sesuai aturan.
  - Tag: `Feature: account-separation, Property 3: Filter akun transaksi berdasarkan tipe`

### Generator untuk Property Tests

```typescript
import fc from 'fast-check';
import type { Account, AccountType } from '@/types';

const accountTypeArb: fc.Arbitrary<AccountType> = fc.constantFrom(
  'bank', 'e-wallet', 'cash', 'credit_card', 'investment', 'tabungan', 'dana_darurat'
);

const accountArb: fc.Arbitrary<Account> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: accountTypeArb,
  balance: fc.integer({ min: -100_000_000, max: 100_000_000 }),
  credit_limit: fc.option(fc.integer({ min: 0, max: 100_000_000 }), { nil: null }),
  due_date: fc.option(fc.integer({ min: 1, max: 28 }), { nil: null }),
  target_amount: fc.option(fc.integer({ min: 0, max: 100_000_000 }), { nil: null }),
  is_deleted: fc.boolean(),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

const accountListArb = fc.array(accountArb, { minLength: 0, maxLength: 20 });
```
