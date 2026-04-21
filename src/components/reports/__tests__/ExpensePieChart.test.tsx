import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExpensePieChart from '../ExpensePieChart';
import type { CategoryExpense } from '@/lib/report-utils';

// Recharts uses ResizeObserver internally; stub it for jsdom
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const sampleData: CategoryExpense[] = [
  {
    categoryId: '1',
    categoryName: 'Makan',
    categoryIcon: '🍔',
    amount: 500000,
    percentage: 50,
    color: '#3B82F6',
  },
  {
    categoryId: '2',
    categoryName: 'Transport',
    categoryIcon: '🚗',
    amount: 300000,
    percentage: 30,
    color: '#EF4444',
  },
  {
    categoryId: '3',
    categoryName: 'Hiburan',
    categoryIcon: '🎬',
    amount: 200000,
    percentage: 20,
    color: '#10B981',
  },
];

describe('ExpensePieChart', () => {
  it('renders empty state when data is empty', () => {
    render(<ExpensePieChart data={[]} totalExpenses={0} />);
    expect(screen.getByText('Belum ada data pengeluaran')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<ExpensePieChart data={sampleData} totalExpenses={1000000} />);
    expect(screen.getByText('Distribusi Pengeluaran')).toBeInTheDocument();
  });

  it('renders accessible data table with category names, amounts, and percentages', () => {
    render(<ExpensePieChart data={sampleData} totalExpenses={1000000} />);

    const table = screen.getByRole('table', { name: /distribusi pengeluaran/i });
    expect(table).toBeInTheDocument();

    // Column headers
    expect(screen.getByText('Kategori')).toBeInTheDocument();
    expect(screen.getByText('Jumlah')).toBeInTheDocument();
    expect(screen.getByText('Persentase')).toBeInTheDocument();

    // Category rows
    expect(screen.getByText('Makan')).toBeInTheDocument();
    expect(screen.getByText('Rp 500.000')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Rp 300.000')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();

    expect(screen.getByText('Hiburan')).toBeInTheDocument();
    expect(screen.getByText('Rp 200.000')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('renders total row in accessible table', () => {
    render(<ExpensePieChart data={sampleData} totalExpenses={1000000} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Rp 1.000.000')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('hides the chart from screen readers with aria-hidden', () => {
    const { container } = render(
      <ExpensePieChart data={sampleData} totalExpenses={1000000} />,
    );
    const chartContainer = container.querySelector('[aria-hidden="true"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('applies sr-only class to the data table', () => {
    render(<ExpensePieChart data={sampleData} totalExpenses={1000000} />);
    const table = screen.getByRole('table', { name: /distribusi pengeluaran/i });
    expect(table.className).toContain('sr-only');
  });
});
