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
  gold_brand: null,
  gold_weight_grams: null,
  gold_purchase_price_per_gram: null,
  invested_amount: null,
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

  it('shows balance and P/L for investment account with valid invested_amount', () => {
    const investmentAccounts = [
      makeAccount({
        id: 'inv-1',
        name: 'Stockbit',
        type: 'investment',
        balance: 15000000,
        invested_amount: 10000000,
      }),
    ];
    render(<AccountSummaryStrip accounts={investmentAccounts} />);
    expect(screen.getByText('Stockbit')).toBeInTheDocument();
    // Balance displayed as primary value
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument();
    // P/L displayed below (profit: +5,000,000) with green color
    const listitem = screen.getByRole('listitem');
    const paragraphs = listitem.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    // Second paragraph is the P/L line
    expect(paragraphs[1].textContent).toMatch(/5\.000\.000/);
    expect(paragraphs[1].className).toContain('text-success');
  });

  it('shows only balance for investment account without invested_amount', () => {
    const investmentAccounts = [
      makeAccount({
        id: 'inv-2',
        name: 'Pluang',
        type: 'investment',
        balance: 5000000,
        invested_amount: null,
      }),
    ];
    render(<AccountSummaryStrip accounts={investmentAccounts} />);
    expect(screen.getByText('Pluang')).toBeInTheDocument();
    expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument();
    // Should only have one text element with the balance (no P/L line)
    const listitem = screen.getByRole('listitem');
    const paragraphs = listitem.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
  });

  it('shows loss with red color for investment account with negative P/L', () => {
    const investmentAccounts = [
      makeAccount({
        id: 'inv-3',
        name: 'Crypto',
        type: 'investment',
        balance: 8000000,
        invested_amount: 10000000,
      }),
    ];
    render(<AccountSummaryStrip accounts={investmentAccounts} />);
    // P/L is -2,000,000 (loss)
    const plElement = screen.getByText(/2\.000\.000/);
    expect(plElement.className).toContain('text-danger');
  });
});
