import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountSummaryStrip from '../AccountSummaryStrip';
import type { Account } from '@/types';

const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc-1',
  user_id: 'user-1',
  name: 'BCA',
  type: 'bank',
  balance: 1000000,
  credit_limit: null,
  due_date: null,
  target_amount: null,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const accounts: Account[] = [
  makeAccount({ id: 'acc-1', name: 'BCA', type: 'bank', balance: 2000000 }),
  makeAccount({ id: 'acc-2', name: 'GoPay', type: 'e-wallet', balance: 500000 }),
];

describe('AccountSummaryStrip', () => {
  it('renders without label when label prop is not provided', () => {
    render(<AccountSummaryStrip accounts={accounts} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Ringkasan akun');
  });

  it('renders label as heading when label prop is provided', () => {
    render(<AccountSummaryStrip accounts={accounts} label="Akun Operasional" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Akun Operasional');
  });

  it('uses label as aria-label on the list when label is provided', () => {
    render(<AccountSummaryStrip accounts={accounts} label="Simpanan & Investasi" />);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Simpanan & Investasi');
  });

  it('returns null when accounts array is empty', () => {
    const { container } = render(<AccountSummaryStrip accounts={[]} label="Akun Operasional" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders all account names and balances', () => {
    render(<AccountSummaryStrip accounts={accounts} />);
    expect(screen.getByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('GoPay')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
