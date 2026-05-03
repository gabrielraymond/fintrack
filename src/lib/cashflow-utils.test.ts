import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  canNavigateCashFlowNext,
  getPreviousCashFlowPeriod,
  getNextCashFlowPeriod,
  formatCashFlowPeriodLabel,
} from './cashflow-utils';

describe('canNavigateCashFlowNext', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for the current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 2024
    expect(canNavigateCashFlowNext(5, 2024)).toBe(false);
  });

  it('returns false for a future month in the same year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 2024
    expect(canNavigateCashFlowNext(8, 2024)).toBe(false);
  });

  it('returns false for a future year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 2024
    expect(canNavigateCashFlowNext(0, 2025)).toBe(false);
  });

  it('returns true for a past month in the same year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 2024
    expect(canNavigateCashFlowNext(3, 2024)).toBe(true);
  });

  it('returns true for a past year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15)); // June 2024
    expect(canNavigateCashFlowNext(11, 2023)).toBe(true);
  });
});

describe('getPreviousCashFlowPeriod', () => {
  it('returns previous month for mid-year', () => {
    expect(getPreviousCashFlowPeriod(5, 2024)).toEqual({ month: 4, year: 2024 });
  });

  it('wraps January to December of previous year', () => {
    expect(getPreviousCashFlowPeriod(0, 2024)).toEqual({ month: 11, year: 2023 });
  });

  it('returns previous month for December', () => {
    expect(getPreviousCashFlowPeriod(11, 2024)).toEqual({ month: 10, year: 2024 });
  });
});

describe('getNextCashFlowPeriod', () => {
  it('returns next month for mid-year', () => {
    expect(getNextCashFlowPeriod(5, 2024)).toEqual({ month: 6, year: 2024 });
  });

  it('wraps December to January of next year', () => {
    expect(getNextCashFlowPeriod(11, 2024)).toEqual({ month: 0, year: 2025 });
  });

  it('returns next month for January', () => {
    expect(getNextCashFlowPeriod(0, 2024)).toEqual({ month: 1, year: 2024 });
  });
});

describe('formatCashFlowPeriodLabel', () => {
  describe('cutoffDate = 1 (standard calendar month)', () => {
    it('returns full month name + year for January', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-01-01', end: '2024-02-01' }, 1))
        .toBe('Januari 2024');
    });

    it('returns full month name + year for December', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-12-01', end: '2025-01-01' }, 1))
        .toBe('Desember 2024');
    });

    it('returns full month name + year for June', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-06-01', end: '2024-07-01' }, 1))
        .toBe('Juni 2024');
    });
  });

  describe('cutoffDate > 1 (date range format)', () => {
    it('returns date range for cutoff=25 within same year', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-01-25', end: '2024-02-25' }, 25))
        .toBe('25 Jan – 24 Feb');
    });

    it('returns date range for cutoff=10', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-06-10', end: '2024-07-10' }, 10))
        .toBe('10 Jun – 9 Jul');
    });

    it('returns date range crossing year boundary', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-12-25', end: '2025-01-25' }, 25))
        .toBe('25 Des – 24 Jan');
    });

    it('returns date range for cutoff=15', () => {
      expect(formatCashFlowPeriodLabel({ start: '2024-03-15', end: '2024-04-15' }, 15))
        .toBe('15 Mar – 14 Apr');
    });
  });
});
