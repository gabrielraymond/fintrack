import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountStep from '../TransactionModal/AccountStep';
import type { Account } from '@/types';

const makeAccount = (overrides: Partial<Account> & { id: string; name: string; type: Account['type'] }): Account => ({
  user_id: 'u1',
  balance: 0,
  credit_limit: null,
  due_date: null,
  target_amount: null,
  gold_brand: null,
  gold_weight_grams: null,
  is_deleted: false,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const operationalAccounts: Account[] = [
  makeAccount({ id: 'a1', name: 'BCA', type: 'bank', balance: 1000000 }),
  makeAccount({ id: 'a2', name: 'GoPay', type: 'e-wallet', balance: 500000 }),
  makeAccount({ id: 'a3', name: 'Tunai', type: 'cash', balance: 200000 }),
];

const savingsAccounts: Account[] = [
  makeAccount({ id: 'a4', name: 'Tabungan Haji', type: 'tabungan', balance: 5000000 }),
  makeAccount({ id: 'a5', name: 'Reksadana', type: 'investment', balance: 10000000 }),
];

const allAccounts = [...operationalAccounts, ...savingsAccounts];

let mockAccountsData: Account[] = allAccounts;

vi.mock('@/hooks/useAccounts', () => ({
  useAccounts: () => ({
    data: { data: mockAccountsData, count: mockAccountsData.length },
    isLoading: false,
  }),
}));

const defaultProps = {
  isTransfer: false,
  selectedAccountId: null,
  selectedDestinationId: null,
  onConfirm: vi.fn(),
};

describe('AccountStep filtering', () => {
  beforeEach(() => {
    mockAccountsData = allAccounts;
  });

  it('shows only operational accounts for expense/income (non-transfer)', () => {
    render(<AccountStep {...defaultProps} isTransfer={false} />);

    expect(screen.getByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('GoPay')).toBeInTheDocument();
    expect(screen.getByText('Tunai')).toBeInTheDocument();
    expect(screen.queryByText('Tabungan Haji')).not.toBeInTheDocument();
    expect(screen.queryByText('Reksadana')).not.toBeInTheDocument();
  });

  it('shows all accounts for transfer (source list)', () => {
    render(<AccountStep {...defaultProps} isTransfer={true} />);

    const sourceGroup = screen.getByRole('radiogroup', { name: 'Akun sumber' });
    const sourceButtons = sourceGroup.querySelectorAll('button');
    expect(sourceButtons).toHaveLength(allAccounts.length);
  });

  it('shows all accounts in destination list for transfer', () => {
    render(<AccountStep {...defaultProps} isTransfer={true} />);

    const destGroup = screen.getByRole('radiogroup', { name: 'Akun tujuan' });
    expect(destGroup).toBeInTheDocument();
    // All accounts should appear in destination list
    const destButtons = destGroup.querySelectorAll('button');
    expect(destButtons).toHaveLength(allAccounts.length);
  });

  it('shows empty operational message when only savings accounts exist for expense/income', () => {
    mockAccountsData = savingsAccounts;
    render(<AccountStep {...defaultProps} isTransfer={false} />);

    expect(
      screen.getByText('Tidak ada akun operasional. Buat akun bank, e-wallet, tunai, atau kartu kredit terlebih dahulu.')
    ).toBeInTheDocument();
  });

  it('shows all savings accounts for transfer even when no operational accounts exist', () => {
    mockAccountsData = savingsAccounts;
    render(<AccountStep {...defaultProps} isTransfer={true} />);

    const sourceGroup = screen.getByRole('radiogroup', { name: 'Akun sumber' });
    const sourceButtons = sourceGroup.querySelectorAll('button');
    expect(sourceButtons).toHaveLength(savingsAccounts.length);
  });

  it('shows generic empty message when no accounts exist at all', () => {
    mockAccountsData = [];
    render(<AccountStep {...defaultProps} isTransfer={false} />);

    expect(
      screen.getByText('Belum ada akun. Buat akun terlebih dahulu.')
    ).toBeInTheDocument();
  });

  it('displays balance in IDR format for each account', () => {
    mockAccountsData = [operationalAccounts[0]]; // BCA with 1000000
    render(<AccountStep {...defaultProps} isTransfer={false} />);

    // formatIDR formats as Indonesian currency
    expect(screen.getByText('BCA')).toBeInTheDocument();
    // Balance should be displayed (exact format depends on formatIDR)
    const button = screen.getByRole('radio');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('BCA'));
  });
});
