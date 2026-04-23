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
