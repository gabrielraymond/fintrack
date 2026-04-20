import { describe, it, expect } from 'vitest';
import { generateTransactionsCSV } from './csv-export';
import type { Transaction, Category, Account } from '@/types';

describe('generateTransactionsCSV', () => {
  const categories: Category[] = [
    { id: 'cat-1', user_id: 'u1', name: 'Makan', icon: '🍔', is_default: true, created_at: '' },
    { id: 'cat-2', user_id: 'u1', name: 'Transport', icon: '🚗', is_default: true, created_at: '' },
  ];

  const accounts: Account[] = [
    { id: 'acc-1', user_id: 'u1', name: 'BCA', type: 'bank', balance: 1000000, credit_limit: null, due_date: null, is_deleted: false, created_at: '', updated_at: '' },
  ];

  it('generates CSV with correct headers', () => {
    const csv = generateTransactionsCSV([], categories, accounts);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Tanggal,Tipe,Kategori,Jumlah,Akun,Catatan');
  });

  it('generates one row per transaction plus header', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1', user_id: 'u1', account_id: 'acc-1', destination_account_id: null,
        category_id: 'cat-1', type: 'expense', amount: 50000, note: 'Makan siang',
        date: '2024-03-15', created_at: '', updated_at: '',
      },
      {
        id: 'tx-2', user_id: 'u1', account_id: 'acc-1', destination_account_id: null,
        category_id: 'cat-2', type: 'income', amount: 100000, note: null,
        date: '2024-03-16', created_at: '', updated_at: '',
      },
    ];

    const csv = generateTransactionsCSV(transactions, categories, accounts);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('maps category and account names correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1', user_id: 'u1', account_id: 'acc-1', destination_account_id: null,
        category_id: 'cat-1', type: 'expense', amount: 50000, note: 'Makan siang',
        date: '2024-03-15', created_at: '', updated_at: '',
      },
    ];

    const csv = generateTransactionsCSV(transactions, categories, accounts);
    const lines = csv.split('\n');
    const row = lines[1];
    expect(row).toContain('Makan');
    expect(row).toContain('BCA');
    expect(row).toContain('Pengeluaran');
    expect(row).toContain('50000');
    expect(row).toContain('Makan siang');
  });

  it('uses dash for missing category (transfers)', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-2', user_id: 'u1', account_id: 'acc-1', destination_account_id: null,
        category_id: null, type: 'transfer', amount: 100000, note: null,
        date: '2024-03-15', created_at: '', updated_at: '',
      },
    ];

    const csv = generateTransactionsCSV(transactions, categories, accounts);
    const lines = csv.split('\n');
    const fields = lines[1].split(',');
    // Kategori field should be '-'
    expect(fields[2]).toBe('-');
  });

  it('escapes fields containing commas', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-3', user_id: 'u1', account_id: 'acc-1', destination_account_id: null,
        category_id: 'cat-1', type: 'expense', amount: 25000, note: 'Makan, minum',
        date: '2024-03-15', created_at: '', updated_at: '',
      },
    ];

    const csv = generateTransactionsCSV(transactions, categories, accounts);
    expect(csv).toContain('"Makan, minum"');
  });
});
