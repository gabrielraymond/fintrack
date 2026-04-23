import { describe, it, expect } from 'vitest';
import type { Account, AccountType } from '@/types';
import { calculateNetWorth, calculateNetWorthBreakdown } from '../useNetWorth';

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

describe('calculateNetWorth (backward compatibility)', () => {
  it('returns 0 for empty array', () => {
    expect(calculateNetWorth([])).toBe(0);
  });

  it('sums active account balances', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'cash', balance: 3000 }),
    ];
    expect(calculateNetWorth(accounts)).toBe(8000);
  });

  it('excludes soft-deleted accounts', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'cash', balance: 3000, is_deleted: true }),
    ];
    expect(calculateNetWorth(accounts)).toBe(5000);
  });
});

describe('calculateNetWorthBreakdown', () => {
  it('returns all zeros for empty array', () => {
    const result = calculateNetWorthBreakdown([]);
    expect(result).toEqual({ total: 0, operational: 0, savings: 0 });
  });

  it('computes breakdown with mixed account types', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'cash', balance: 3000 }),
      makeAccount({ id: '3', type: 'tabungan', balance: 10000 }),
      makeAccount({ id: '4', type: 'investment', balance: 20000 }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(38000);
    expect(result.operational).toBe(8000);
    expect(result.savings).toBe(30000);
  });

  it('satisfies invariant: total === operational + savings', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'credit_card', balance: -2000 }),
      makeAccount({ id: '3', type: 'tabungan', balance: 10000 }),
      makeAccount({ id: '4', type: 'dana_darurat', balance: 7000 }),
      makeAccount({ id: '5', type: 'e-wallet', balance: 1500 }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(result.operational + result.savings);
  });

  it('excludes soft-deleted accounts from all values', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'bank', balance: 3000, is_deleted: true }),
      makeAccount({ id: '3', type: 'tabungan', balance: 10000 }),
      makeAccount({ id: '4', type: 'investment', balance: 8000, is_deleted: true }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(15000);
    expect(result.operational).toBe(5000);
    expect(result.savings).toBe(10000);
  });

  it('handles negative balances (credit card debt)', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 10000 }),
      makeAccount({ id: '2', type: 'credit_card', balance: -5000 }),
      makeAccount({ id: '3', type: 'tabungan', balance: 20000 }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(25000);
    expect(result.operational).toBe(5000);
    expect(result.savings).toBe(20000);
  });

  it('handles only operational accounts', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000 }),
      makeAccount({ id: '2', type: 'e-wallet', balance: 2000 }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(7000);
    expect(result.operational).toBe(7000);
    expect(result.savings).toBe(0);
  });

  it('handles only savings accounts', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'tabungan', balance: 15000 }),
      makeAccount({ id: '2', type: 'dana_darurat', balance: 5000 }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result.total).toBe(20000);
    expect(result.operational).toBe(0);
    expect(result.savings).toBe(20000);
  });

  it('handles all accounts soft-deleted', () => {
    const accounts = [
      makeAccount({ id: '1', type: 'bank', balance: 5000, is_deleted: true }),
      makeAccount({ id: '2', type: 'tabungan', balance: 10000, is_deleted: true }),
    ];
    const result = calculateNetWorthBreakdown(accounts);
    expect(result).toEqual({ total: 0, operational: 0, savings: 0 });
  });
});
