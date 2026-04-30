import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionFilters from '../TransactionFilters';

// Mock hooks
const mockAccounts = [
  { id: 'a1', user_id: 'u1', name: 'BCA', type: 'bank' as const, balance: 100, credit_limit: null, due_date: null, target_amount: null, gold_brand: null, gold_weight_grams: null, is_deleted: false, created_at: '', updated_at: '' },
  { id: 'a2', user_id: 'u1', name: 'GoPay', type: 'e-wallet' as const, balance: 50, credit_limit: null, due_date: null, target_amount: null, gold_brand: null, gold_weight_grams: null, is_deleted: false, created_at: '', updated_at: '' },
];

const mockCategories = [
  { id: 'c1', user_id: 'u1', name: 'Makan', icon: '🍔', is_default: true, created_at: '' },
  { id: 'c2', user_id: 'u1', name: 'Transport', icon: '🚗', is_default: true, created_at: '' },
];

vi.mock('@/hooks/useAccounts', () => ({
  useAccounts: () => ({ data: { data: mockAccounts, count: 2 } }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: mockCategories }),
}));

describe('TransactionFilters', () => {
  it('renders all filter dropdowns with labels in Bahasa Indonesia', () => {
    render(<TransactionFilters filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText('Filter berdasarkan akun')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter berdasarkan kategori')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter berdasarkan tipe transaksi')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter berdasarkan bulan')).toBeInTheDocument();
  });

  it('renders account options from useAccounts data', () => {
    render(<TransactionFilters filters={{}} onFilterChange={vi.fn()} />);
    const accountSelect = screen.getByLabelText('Filter berdasarkan akun') as HTMLSelectElement;
    expect(accountSelect).toBeInTheDocument();
    expect(screen.getByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('GoPay')).toBeInTheDocument();
  });

  it('renders category options from useCategories data', () => {
    render(<TransactionFilters filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByText('Makan')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('renders type options in Bahasa Indonesia', () => {
    render(<TransactionFilters filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByText('Pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Pengeluaran')).toBeInTheDocument();
    expect(screen.getByText('Transfer')).toBeInTheDocument();
  });

  it('calls onFilterChange when account filter changes', () => {
    const onFilterChange = vi.fn();
    render(<TransactionFilters filters={{}} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByLabelText('Filter berdasarkan akun'), { target: { value: 'a1' } });
    expect(onFilterChange).toHaveBeenCalledWith({ accountId: 'a1' });
  });

  it('calls onFilterChange when category filter changes', () => {
    const onFilterChange = vi.fn();
    render(<TransactionFilters filters={{}} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByLabelText('Filter berdasarkan kategori'), { target: { value: 'c1' } });
    expect(onFilterChange).toHaveBeenCalledWith({ categoryId: 'c1' });
  });

  it('calls onFilterChange when type filter changes', () => {
    const onFilterChange = vi.fn();
    render(<TransactionFilters filters={{}} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByLabelText('Filter berdasarkan tipe transaksi'), { target: { value: 'expense' } });
    expect(onFilterChange).toHaveBeenCalledWith({ type: 'expense' });
  });

  it('shows Reset button when filters are active', () => {
    render(<TransactionFilters filters={{ accountId: 'a1' }} onFilterChange={vi.fn()} />);
    expect(screen.getByLabelText('Reset semua filter')).toBeInTheDocument();
  });

  it('does not show Reset button when no filters are active', () => {
    render(<TransactionFilters filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.queryByLabelText('Reset semua filter')).not.toBeInTheDocument();
  });

  it('calls onFilterChange with empty object when Reset is clicked', () => {
    const onFilterChange = vi.fn();
    render(<TransactionFilters filters={{ accountId: 'a1', type: 'income' }} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByLabelText('Reset semua filter'));
    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  it('preserves existing filters when changing one filter', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFilters
        filters={{ accountId: 'a1', type: 'income' }}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Filter berdasarkan kategori'), { target: { value: 'c2' } });
    expect(onFilterChange).toHaveBeenCalledWith({
      accountId: 'a1',
      type: 'income',
      categoryId: 'c2',
    });
  });
});
