import type { AccountType, GoalCategory } from '@/types';

/**
 * Default Indonesian expense/income categories seeded for new users.
 */
export const DEFAULT_CATEGORIES: ReadonlyArray<{ name: string; icon: string }> = [
  { name: 'Makan', icon: '🍔' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Kost/Sewa', icon: '🏠' },
  { name: 'Belanja', icon: '🛒' },
  { name: 'Hiburan', icon: '🎬' },
  { name: 'Kesehatan', icon: '💊' },
  { name: 'Pendidikan', icon: '📚' },
  { name: 'Tagihan', icon: '📄' },
  { name: 'Gaji', icon: '💰' },
  { name: 'Investasi', icon: '📈' },
  { name: 'Lainnya', icon: '📦' },
] as const;

/**
 * Account type definitions with Indonesian labels.
 */
export const ACCOUNT_TYPES: ReadonlyArray<{
  value: AccountType;
  label: string;
}> = [
  { value: 'bank', label: 'Bank' },
  { value: 'e-wallet', label: 'Dompet Digital' },
  { value: 'cash', label: 'Tunai' },
  { value: 'credit_card', label: 'Kartu Kredit' },
  { value: 'investment', label: 'Investasi' },
  { value: 'tabungan', label: 'Tabungan' },
  { value: 'dana_darurat', label: 'Dana Darurat' },
] as const;

/**
 * Goal category definitions with Indonesian labels.
 */
export const GOAL_CATEGORIES: ReadonlyArray<{
  value: GoalCategory;
  label: string;
}> = [
  { value: 'tabungan', label: 'Tabungan' },
  { value: 'dana_darurat', label: 'Dana Darurat' },
  { value: 'liburan', label: 'Liburan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'pelunasan_hutang', label: 'Pelunasan Hutang' },
  { value: 'lainnya', label: 'Lainnya' },
] as const;
