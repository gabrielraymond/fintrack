import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IncomeExpenseTrendChart from '../IncomeExpenseTrendChart';
import type { MonthlyTrendData } from '@/lib/report-utils';

// Recharts uses ResizeObserver internally; stub it for jsdom
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const sampleData: MonthlyTrendData[] = [
  { month: 'Jan', monthFull: 'Januari 2024', income: 5000000, expense: 3000000 },
  { month: 'Feb', monthFull: 'Februari 2024', income: 4500000, expense: 3500000 },
  { month: 'Mar', monthFull: 'Maret 2024', income: 6000000, expense: 2500000 },
  { month: 'Apr', monthFull: 'April 2024', income: 5500000, expense: 4000000 },
  { month: 'Mei', monthFull: 'Mei 2024', income: 7000000, expense: 3200000 },
  { month: 'Jun', monthFull: 'Juni 2024', income: 5200000, expense: 2800000 },
];

describe('IncomeExpenseTrendChart', () => {
  it('renders the title', () => {
    render(<IncomeExpenseTrendChart data={sampleData} />);
    expect(screen.getByText('Tren Pemasukan & Pengeluaran')).toBeInTheDocument();
  });

  it('hides the chart from screen readers with aria-hidden', () => {
    const { container } = render(<IncomeExpenseTrendChart data={sampleData} />);
    const chartContainer = container.querySelector('[aria-hidden="true"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    render(<IncomeExpenseTrendChart data={[]} />);
    expect(screen.getByText('Tren Pemasukan & Pengeluaran')).toBeInTheDocument();
  });

  it('wraps content in a Card component', () => {
    const { container } = render(<IncomeExpenseTrendChart data={sampleData} />);
    const card = container.querySelector('.rounded-xl.bg-surface');
    expect(card).toBeInTheDocument();
  });
});
