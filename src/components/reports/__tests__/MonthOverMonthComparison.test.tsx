import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MonthOverMonthComparison from '../MonthOverMonthComparison';
import type { ComparisonMetric } from '@/lib/report-utils';

const baseMetrics: ComparisonMetric[] = [
  {
    label: 'Pemasukan',
    currentValue: 5000000,
    previousValue: 4000000,
    percentageChange: 25,
    isExpense: false,
  },
  {
    label: 'Pengeluaran',
    currentValue: 3000000,
    previousValue: 2000000,
    percentageChange: 50,
    isExpense: true,
  },
  {
    label: 'Selisih Bersih',
    currentValue: 2000000,
    previousValue: 2000000,
    percentageChange: 0,
    isExpense: false,
  },
];

describe('MonthOverMonthComparison', () => {
  it('renders the title in Bahasa Indonesia', () => {
    render(<MonthOverMonthComparison metrics={baseMetrics} />);
    expect(screen.getByText('Perbandingan Bulan Sebelumnya')).toBeInTheDocument();
  });

  it('renders all metric labels', () => {
    render(<MonthOverMonthComparison metrics={baseMetrics} />);
    expect(screen.getByText('Pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Pengeluaran')).toBeInTheDocument();
    expect(screen.getByText('Selisih Bersih')).toBeInTheDocument();
  });

  it('displays current values in IDR format', () => {
    render(<MonthOverMonthComparison metrics={baseMetrics} />);
    expect(screen.getByText('Rp 5.000.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 3.000.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 2.000.000')).toBeInTheDocument();
  });

  it('shows green up arrow for positive income change', () => {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Pemasukan',
        currentValue: 5000000,
        previousValue: 4000000,
        percentageChange: 25,
        isExpense: false,
      },
    ];
    render(<MonthOverMonthComparison metrics={metrics} />);
    const indicator = screen.getByText('25.0%');
    expect(indicator.className).toContain('text-success');
  });

  it('shows red down arrow for negative income change', () => {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Pemasukan',
        currentValue: 3000000,
        previousValue: 4000000,
        percentageChange: -25,
        isExpense: false,
      },
    ];
    render(<MonthOverMonthComparison metrics={metrics} />);
    const indicator = screen.getByText('25.0%');
    expect(indicator.className).toContain('text-danger');
  });

  it('shows red up arrow for positive expense change (unfavorable)', () => {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Pengeluaran',
        currentValue: 3000000,
        previousValue: 2000000,
        percentageChange: 50,
        isExpense: true,
      },
    ];
    render(<MonthOverMonthComparison metrics={metrics} />);
    const indicator = screen.getByText('50.0%');
    expect(indicator.className).toContain('text-danger');
  });

  it('shows green down arrow for negative expense change (favorable)', () => {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Pengeluaran',
        currentValue: 1500000,
        previousValue: 2000000,
        percentageChange: -25,
        isExpense: true,
      },
    ];
    render(<MonthOverMonthComparison metrics={metrics} />);
    const indicator = screen.getByText('25.0%');
    expect(indicator.className).toContain('text-success');
  });

  it('displays "-" when percentage change is null (no previous data)', () => {
    const metrics: ComparisonMetric[] = [
      {
        label: 'Pemasukan',
        currentValue: 5000000,
        previousValue: 0,
        percentageChange: null,
        isExpense: false,
      },
      {
        label: 'Pengeluaran',
        currentValue: 3000000,
        previousValue: 0,
        percentageChange: null,
        isExpense: true,
      },
      {
        label: 'Selisih Bersih',
        currentValue: 2000000,
        previousValue: 0,
        percentageChange: null,
        isExpense: false,
      },
    ];
    render(<MonthOverMonthComparison metrics={metrics} />);
    const dashes = screen.getAllByText('-');
    expect(dashes).toHaveLength(3);
  });
});
