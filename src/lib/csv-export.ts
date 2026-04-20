import type { Transaction, Category, Account } from '@/types';
import { formatDate } from './formatters';

/**
 * Escapes a CSV field value by wrapping in quotes if it contains
 * commas, quotes, or newlines.
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const TYPE_LABELS: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  transfer: 'Transfer',
};

/**
 * Generates a CSV string from transactions.
 * Columns: Tanggal, Tipe, Kategori, Jumlah, Akun, Catatan
 * Requirements: 14.1, 14.2
 */
export function generateTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Akun', 'Catatan'];

  const rows = transactions.map((tx) => [
    formatDate(tx.date),
    TYPE_LABELS[tx.type] ?? tx.type,
    tx.category_id ? (categoryMap.get(tx.category_id) ?? '-') : '-',
    tx.amount.toString(),
    accountMap.get(tx.account_id) ?? '-',
    tx.note ?? '',
  ]);

  return [
    headers.map(escapeCSVField).join(','),
    ...rows.map((row) => row.map(escapeCSVField).join(',')),
  ].join('\n');
}

/**
 * Generates a CSV file from transactions and triggers a browser download.
 * Requirements: 14.1, 14.2
 */
export function exportTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): void {
  const csvContent = generateTransactionsCSV(transactions, categories, accounts);
  downloadBlob(csvContent, 'fintrack-transaksi.csv', 'text/csv;charset=utf-8;');
}

/**
 * Creates a Blob from content and triggers a browser download.
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
