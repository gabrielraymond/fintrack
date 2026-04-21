import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import YearlySummaryView from '../YearlySummaryView';
import type { YearlySummaryData } from '@/lib/report-utils';

// Mock Recharts to avoid rendering issues in test environment
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockData: YearlySummaryData = {
  year: 2024,
  totalIncome: 60_000_000,
  totalExpenses: 42_000_000,
  netChange: 18_000_000,
  avgMonthlyIncome: 5_000_000,
  avgMonthlyExpenses: 3_500_000,
  monthlyData: Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][i],
    monthFull: `Month ${i + 1} 2024`,
    income: 5_000_000,
    expense: 3_500_000,
  })),
};

describe('YearlySummaryView', () => {
  it('renders the year in the heading', () => {
    render(<YearlySummaryView data={mockData} />);
    expect(screen.getByText('Ringkasan Tahun 2024')).toBeInTheDocument();
  });

  it('displays annual totals in IDR format', () => {
    render(<YearlySummaryView data={mockData} />);
    expect(screen.getByText('Total Pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Total Pengeluaran')).toBeInTheDocument();
    expect(screen.getByText('Selisih Bersih')).toBeInTheDocument();
  });

  it('displays monthly averages', () => {
    render(<YearlySummaryView data={mockData} />);
    expect(screen.getByText('Rata-rata Pemasukan/Bulan')).toBeInTheDocument();
    expect(screen.getByText('Rata-rata Pengeluaran/Bulan')).toBeInTheDocument();
  });

  it('applies green color for positive net change', () => {
    render(<YearlySummaryView data={mockData} />);
    const netLabel = screen.getByText('Selisih Bersih');
    const netValue = netLabel.parentElement?.querySelector('.text-success');
    expect(netValue).toBeInTheDocument();
  });

  it('applies red color for negative net change', () => {
    const negativeData: YearlySummaryData = {
      ...mockData,
      netChange: -5_000_000,
    };
    render(<YearlySummaryView data={negativeData} />);
    const netLabel = screen.getByText('Selisih Bersih');
    const netValue = netLabel.parentElement?.querySelector('.text-danger');
    expect(netValue).toBeInTheDocument();
  });

  it('renders the 12-month bar chart', () => {
    render(<YearlySummaryView data={mockData} />);
    expect(screen.getByText('Tren Pemasukan & Pengeluaran')).toBeInTheDocument();
  });
});
