import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SavingsProgressSection from '../SavingsProgressSection';
import type { Account } from '@/types';

const baseAccount: Account = {
  id: '1',
  user_id: 'u1',
  name: 'Tabungan Liburan',
  type: 'tabungan',
  balance: 3000000,
  credit_limit: null,
  due_date: null,
  target_amount: 10000000,
  gold_brand: null,
  gold_weight_grams: null,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const emergencyAccount: Account = {
  ...baseAccount,
  id: '2',
  name: 'Dana Darurat',
  type: 'dana_darurat',
  balance: 5000000,
  target_amount: 20000000,
};

describe('SavingsProgressSection', () => {
  it('renders section with savings accounts that have targets', () => {
    render(<SavingsProgressSection accounts={[baseAccount, emergencyAccount]} />);
    expect(screen.getByText('Progres Tabungan')).toBeInTheDocument();
    expect(screen.getByText('Tabungan Liburan')).toBeInTheDocument();
    expect(screen.getByText('Dana Darurat')).toBeInTheDocument();
  });

  it('renders progress bars for each account', () => {
    render(<SavingsProgressSection accounts={[baseAccount, emergencyAccount]} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
  });

  it('returns null when no accounts have targets', () => {
    const noTarget: Account = { ...baseAccount, target_amount: null };
    const { container } = render(<SavingsProgressSection accounts={[noTarget]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when accounts array is empty', () => {
    const { container } = render(<SavingsProgressSection accounts={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('filters out non-savings accounts', () => {
    const bankAccount: Account = { ...baseAccount, id: '3', name: 'BCA', type: 'bank', target_amount: 5000000 };
    render(<SavingsProgressSection accounts={[baseAccount, bankAccount]} />);
    expect(screen.getByText('Tabungan Liburan')).toBeInTheDocument();
    expect(screen.queryByText('BCA')).not.toBeInTheDocument();
  });

  it('filters out savings accounts with zero target', () => {
    const zeroTarget: Account = { ...baseAccount, id: '3', name: 'Zero Target', target_amount: 0 };
    render(<SavingsProgressSection accounts={[baseAccount, zeroTarget]} />);
    expect(screen.getByText('Tabungan Liburan')).toBeInTheDocument();
    expect(screen.queryByText('Zero Target')).not.toBeInTheDocument();
  });

  it('displays balance and target formatted', () => {
    render(<SavingsProgressSection accounts={[baseAccount]} />);
    // balance 3000000 and target 10000000 (target appears in both section and progress bar)
    expect(screen.getByText(/3\.000\.000.*\/.*10\.000\.000/)).toBeInTheDocument();
  });
});
