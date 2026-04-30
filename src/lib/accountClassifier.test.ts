import { describe, it, expect } from 'vitest';
import type { Account, AccountType } from '@/types';
import {
  OPERATIONAL_ACCOUNT_TYPES,
  SAVINGS_ACCOUNT_TYPES,
  classifyAccountType,
  partitionAccounts,
  sumBalance,
} from './accountClassifier';

function makeAccount(overrides: Partial<Account> & { type: AccountType }): Account {
  return {
    id: 'test-id',
    user_id: 'user-1',
    name: 'Test Account',
    balance: 1000,
    credit_limit: null,
    due_date: null,
    target_amount: null,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('OPERATIONAL_ACCOUNT_TYPES', () => {
  it('contains bank, e-wallet, cash, credit_card', () => {
    expect(OPERATIONAL_ACCOUNT_TYPES).toEqual(['bank', 'e-wallet', 'cash', 'credit_card']);
  });
});

describe('SAVINGS_ACCOUNT_TYPES', () => {
  it('contains tabungan, dana_darurat, investment, gold', () => {
    expect(SAVINGS_ACCOUNT_TYPES).toEqual(['tabungan', 'dana_darurat', 'investment', 'gold']);
  });
});

describe('classifyAccountType', () => {
  it.each([
    ['bank', 'operational'],
    ['e-wallet', 'operational'],
    ['cash', 'operational'],
    ['credit_card', 'operational'],
  ] as const)('classifies %s as %s', (type, expected) => {
    expect(classifyAccountType(type)).toBe(expected);
  });

  it.each([
    ['tabungan', 'savings'],
    ['dana_darurat', 'savings'],
    ['investment', 'savings'],
    ['gold', 'savings'],
  ] as const)('classifies %s as %s', (type, expected) => {
    expect(classifyAccountType(type)).toBe(expected);
  });
});

describe('partitionAccounts', () => {
  it('returns empty arrays for empty input', () => {
    const result = partitionAccounts([]);
    expect(result.operational).toEqual([]);
    expect(result.savings).toEqual([]);
  });

  it('partitions a mixed list correctly', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank' }),
      makeAccount({ id: '2', type: 'tabungan' }),
      makeAccount({ id: '3', type: 'cash' }),
      makeAccount({ id: '4', type: 'investment' }),
    ];
    const result = partitionAccounts(accounts);
    expect(result.operational.map((a) => a.id)).toEqual(['1', '3']);
    expect(result.savings.map((a) => a.id)).toEqual(['2', '4']);
  });

  it('puts all accounts in operational when only operational types', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank' }),
      makeAccount({ id: '2', type: 'e-wallet' }),
    ];
    const result = partitionAccounts(accounts);
    expect(result.operational).toHaveLength(2);
    expect(result.savings).toHaveLength(0);
  });

  it('puts all accounts in savings when only savings types', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'tabungan' }),
      makeAccount({ id: '2', type: 'dana_darurat' }),
    ];
    const result = partitionAccounts(accounts);
    expect(result.operational).toHaveLength(0);
    expect(result.savings).toHaveLength(2);
  });
});

describe('sumBalance', () => {
  it('returns 0 for empty array', () => {
    expect(sumBalance([])).toBe(0);
  });

  it('sums balances of non-deleted accounts', () => {
    const accounts = [
      makeAccount({ type: 'bank', balance: 1000 }),
      makeAccount({ type: 'cash', balance: 500 }),
    ];
    expect(sumBalance(accounts)).toBe(1500);
  });

  it('excludes soft-deleted accounts', () => {
    const accounts = [
      makeAccount({ type: 'bank', balance: 1000, is_deleted: false }),
      makeAccount({ type: 'cash', balance: 500, is_deleted: true }),
    ];
    expect(sumBalance(accounts)).toBe(1000);
  });

  it('handles negative balances (e.g. credit card)', () => {
    const accounts = [
      makeAccount({ type: 'bank', balance: 5000 }),
      makeAccount({ type: 'credit_card', balance: -2000 }),
    ];
    expect(sumBalance(accounts)).toBe(3000);
  });

  it('returns 0 when all accounts are soft-deleted', () => {
    const accounts = [
      makeAccount({ type: 'bank', balance: 1000, is_deleted: true }),
      makeAccount({ type: 'cash', balance: 500, is_deleted: true }),
    ];
    expect(sumBalance(accounts)).toBe(0);
  });
});
