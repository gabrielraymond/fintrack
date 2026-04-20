import { describe, it, expect } from 'vitest';
import { formatIDR, formatDate } from './formatters';

describe('formatIDR', () => {
  it('formats zero', () => {
    const result = formatIDR(0);
    expect(result).toMatch(/Rp/);
    expect(result).toMatch(/0/);
  });

  it('formats a typical amount with period thousands separator', () => {
    const result = formatIDR(1500000);
    // Should contain "Rp" and "1.500.000"
    expect(result).toMatch(/Rp/);
    expect(result).toContain('1.500.000');
  });

  it('formats a small amount', () => {
    const result = formatIDR(500);
    expect(result).toMatch(/Rp/);
    expect(result).toContain('500');
  });

  it('formats negative values', () => {
    const result = formatIDR(-500000);
    expect(result).toMatch(/Rp/);
    expect(result).toContain('500.000');
    // Should contain a minus indicator
    expect(result).toMatch(/-/);
  });

  it('formats large amounts', () => {
    const result = formatIDR(100000000);
    expect(result).toMatch(/Rp/);
    expect(result).toContain('100.000.000');
  });
});

describe('formatDate', () => {
  it('formats a Date object in Bahasa Indonesia', () => {
    const date = new Date(2024, 2, 15); // March 15, 2024
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('2024');
    // Bahasa Indonesia month name for March
    expect(result).toMatch(/Maret/i);
  });

  it('formats an ISO date string', () => {
    const result = formatDate('2024-01-01');
    expect(result).toContain('2024');
    expect(result).toMatch(/Januari/i);
  });

  it('formats December correctly', () => {
    const date = new Date(2023, 11, 25); // December 25, 2023
    const result = formatDate(date);
    expect(result).toContain('25');
    expect(result).toMatch(/Desember/i);
    expect(result).toContain('2023');
  });
});
