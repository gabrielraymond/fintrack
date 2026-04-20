import { describe, it, expect } from 'vitest';
import { isValidTransactionDate } from './validators';

describe('isValidTransactionDate', () => {
  it('accepts today', () => {
    const result = isValidTransactionDate(new Date());
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('accepts a date 6 months ago', () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const result = isValidTransactionDate(sixMonthsAgo);
    expect(result.valid).toBe(true);
  });

  it('rejects a future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const result = isValidTransactionDate(tomorrow);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Tanggal tidak boleh di masa depan');
  });

  it('rejects a date more than 1 year ago', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const result = isValidTransactionDate(twoYearsAgo);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Tanggal tidak boleh lebih dari 1 tahun lalu');
  });

  it('accepts a date exactly at the boundary (start of day, 1 year ago)', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);
    const result = isValidTransactionDate(oneYearAgo);
    expect(result.valid).toBe(true);
  });

  it('accepts yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = isValidTransactionDate(yesterday);
    expect(result.valid).toBe(true);
  });
});
