import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CategoryBreakdown from '../CategoryBreakdown';
import type { CategoryExpense } from '@/lib/report-utils';

const mockData: CategoryExpense[] = [
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
    categoryIcon: '🎮',
    amount: 200000,
    percentage: 20,
    color: '#10B981',
  },
];

describe('CategoryBreakdown', () => {
  it('renders empty state when no data', () => {
    render(<CategoryBreakdown data={[]} />);
    expect(screen.getByText('Belum ada data pengeluaran')).toBeInTheDocument();
  });

  it('renders category names, icons, IDR amounts, and percentages', () => {
    render(<CategoryBreakdown data={mockData} />);
    expect(screen.getByText('Makan')).toBeInTheDocument();
    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('Rp 500.000')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('🚗')).toBeInTheDocument();
    expect(screen.getByText('Rp 300.000')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();

    expect(screen.getByText('Hiburan')).toBeInTheDocument();
    expect(screen.getByText('🎮')).toBeInTheDocument();
    expect(screen.getByText('Rp 200.000')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('renders colored progress bars with correct width and color', () => {
    const { container } = render(<CategoryBreakdown data={mockData} />);
    const bars = container.querySelectorAll('.h-full.rounded-full');
    expect(bars).toHaveLength(3);

    expect((bars[0] as HTMLElement).style.width).toBe('50%');
    expect((bars[0] as HTMLElement).style.backgroundColor).toBe('rgb(59, 130, 246)');

    expect((bars[1] as HTMLElement).style.width).toBe('30%');
    expect((bars[1] as HTMLElement).style.backgroundColor).toBe('rgb(239, 68, 68)');

    expect((bars[2] as HTMLElement).style.width).toBe('20%');
    expect((bars[2] as HTMLElement).style.backgroundColor).toBe('rgb(16, 185, 129)');
  });

  it('renders the section title', () => {
    render(<CategoryBreakdown data={mockData} />);
    expect(screen.getByText('Rincian Pengeluaran')).toBeInTheDocument();
  });
});
