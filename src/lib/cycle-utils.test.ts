import { describe, it, expect } from 'vitest';
import {
  getCycleRange,
  getCycleBudgetMonth,
  getCycleRangeForMonth,
  formatDate,
  getPreviousMonth,
} from './cycle-utils';

describe('formatDate', () => {
  it('formats single-digit month and day with zero padding', () => {
    expect(formatDate(2024, 0, 5)).toBe('2024-01-05');
  });

  it('formats double-digit month and day', () => {
    expect(formatDate(2024, 11, 25)).toBe('2024-12-25');
  });
});

describe('getCycleRange', () => {
  describe('cutoff=1 (bulan kalender standar)', () => {
    it('returns calendar month range for mid-month reference', () => {
      const ref = new Date(2024, 0, 15); // 15 Jan 2024
      expect(getCycleRange(1, ref)).toEqual({
        start: '2024-01-01',
        end: '2024-02-01',
      });
    });

    it('returns calendar month range for first day of month', () => {
      const ref = new Date(2024, 0, 1); // 1 Jan 2024
      expect(getCycleRange(1, ref)).toEqual({
        start: '2024-01-01',
        end: '2024-02-01',
      });
    });

    it('handles year boundary — December', () => {
      const ref = new Date(2024, 11, 15); // 15 Dec 2024
      expect(getCycleRange(1, ref)).toEqual({
        start: '2024-12-01',
        end: '2025-01-01',
      });
    });
  });

  describe('cutoff>1, day >= cutoff (siklus dimulai bulan berjalan)', () => {
    it('cutoff=25, reference=30 Jan → cycle 25 Jan - 25 Feb', () => {
      const ref = new Date(2024, 0, 30); // 30 Jan 2024
      expect(getCycleRange(25, ref)).toEqual({
        start: '2024-01-25',
        end: '2024-02-25',
      });
    });

    it('cutoff=25, reference=25 Jan (tepat di cutoff) → cycle 25 Jan - 25 Feb', () => {
      const ref = new Date(2024, 0, 25); // 25 Jan 2024
      expect(getCycleRange(25, ref)).toEqual({
        start: '2024-01-25',
        end: '2024-02-25',
      });
    });

    it('handles year boundary — cutoff=25, reference=28 Dec', () => {
      const ref = new Date(2024, 11, 28); // 28 Dec 2024
      expect(getCycleRange(25, ref)).toEqual({
        start: '2024-12-25',
        end: '2025-01-25',
      });
    });
  });

  describe('cutoff>1, day < cutoff (siklus dimulai bulan sebelumnya)', () => {
    it('cutoff=25, reference=10 Jan → cycle 25 Dec - 25 Jan', () => {
      const ref = new Date(2024, 0, 10); // 10 Jan 2024
      expect(getCycleRange(25, ref)).toEqual({
        start: '2023-12-25',
        end: '2024-01-25',
      });
    });

    it('cutoff=10, reference=5 Mar → cycle 10 Feb - 10 Mar', () => {
      const ref = new Date(2024, 2, 5); // 5 Mar 2024
      expect(getCycleRange(10, ref)).toEqual({
        start: '2024-02-10',
        end: '2024-03-10',
      });
    });

    it('cutoff=15, reference=1 Jan (year boundary) → cycle 15 Dec prev year - 15 Jan', () => {
      const ref = new Date(2024, 0, 1); // 1 Jan 2024
      expect(getCycleRange(15, ref)).toEqual({
        start: '2023-12-15',
        end: '2024-01-15',
      });
    });
  });
});

describe('getCycleBudgetMonth', () => {
  it('cutoff>15: labels as next month (majority of days)', () => {
    // start "2024-01-25" → day 25 > 15 → budget month = Feb
    expect(getCycleBudgetMonth({ start: '2024-01-25', end: '2024-02-25' })).toBe('2024-02-01');
  });

  it('cutoff<=15: labels as same month', () => {
    // start "2024-03-10" → day 10 <= 15 → budget month = Mar
    expect(getCycleBudgetMonth({ start: '2024-03-10', end: '2024-04-10' })).toBe('2024-03-01');
  });

  it('works for cutoff=1 cycle', () => {
    expect(getCycleBudgetMonth({ start: '2024-03-01', end: '2024-04-01' })).toBe('2024-03-01');
  });

  it('handles year boundary — December start with cutoff>15', () => {
    // start "2024-12-25" → day 25 > 15 → budget month = Jan 2025
    expect(getCycleBudgetMonth({ start: '2024-12-25', end: '2025-01-25' })).toBe('2025-01-01');
  });

  it('cutoff=15: labels as same month (day <= 15)', () => {
    expect(getCycleBudgetMonth({ start: '2024-06-15', end: '2024-07-15' })).toBe('2024-06-01');
  });
});

describe('getCycleRangeForMonth', () => {
  it('cutoff=1, budget month 2024-01-01 → 1 Jan - 1 Feb', () => {
    expect(getCycleRangeForMonth('2024-01-01', 1)).toEqual({
      start: '2024-01-01',
      end: '2024-02-01',
    });
  });

  it('cutoff=25 (>15), budget month 2024-02-01 → 25 Jan - 25 Feb', () => {
    // Budget month is Feb, but cutoff>15 means start is in previous month (Jan)
    expect(getCycleRangeForMonth('2024-02-01', 25)).toEqual({
      start: '2024-01-25',
      end: '2024-02-25',
    });
  });

  it('cutoff=10 (<=15), budget month 2024-06-01 → 10 Jun - 10 Jul', () => {
    expect(getCycleRangeForMonth('2024-06-01', 10)).toEqual({
      start: '2024-06-10',
      end: '2024-07-10',
    });
  });

  it('handles year boundary — cutoff=25, budget month 2025-01-01 → 25 Dec 2024 - 25 Jan 2025', () => {
    expect(getCycleRangeForMonth('2025-01-01', 25)).toEqual({
      start: '2024-12-25',
      end: '2025-01-25',
    });
  });

  it('accepts "YYYY-MM" format without day', () => {
    expect(getCycleRangeForMonth('2024-06', 10)).toEqual({
      start: '2024-06-10',
      end: '2024-07-10',
    });
  });

  it('round-trip: getCycleBudgetMonth(getCycleRangeForMonth(m, c)) === m for cutoff>15', () => {
    const budgetMonth = '2024-05-01';
    const range = getCycleRangeForMonth(budgetMonth, 25);
    expect(getCycleBudgetMonth(range)).toBe(budgetMonth);
  });

  it('round-trip: getCycleBudgetMonth(getCycleRangeForMonth(m, c)) === m for cutoff<=15', () => {
    const budgetMonth = '2024-05-01';
    const range = getCycleRangeForMonth(budgetMonth, 10);
    expect(getCycleBudgetMonth(range)).toBe(budgetMonth);
  });

  it('round-trip: getCycleBudgetMonth(getCycleRangeForMonth(m, c)) === m for cutoff=1', () => {
    const budgetMonth = '2024-05-01';
    const range = getCycleRangeForMonth(budgetMonth, 1);
    expect(getCycleBudgetMonth(range)).toBe(budgetMonth);
  });
});

describe('getPreviousMonth', () => {
  it('returns previous month for mid-year date', () => {
    expect(getPreviousMonth('2024-03-01')).toBe('2024-02-01');
  });

  it('returns previous month for February', () => {
    expect(getPreviousMonth('2024-02-01')).toBe('2024-01-01');
  });

  it('handles year boundary — January to December of previous year', () => {
    expect(getPreviousMonth('2024-01-01')).toBe('2023-12-01');
  });

  it('returns previous month for December', () => {
    expect(getPreviousMonth('2024-12-01')).toBe('2024-11-01');
  });

  it('handles single-digit months with zero padding', () => {
    expect(getPreviousMonth('2024-06-01')).toBe('2024-05-01');
  });
});
