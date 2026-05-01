import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountCard from '../AccountCard';
import type { Account } from '@/types';

const baseAccount: Account = {
  id: '1',
  user_id: 'u1',
  name: 'BCA',
  type: 'bank',
  balance: 1500000,
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
};

describe('AccountCard', () => {
  it('renders account name and type label', () => {
    render(<AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
  });

  it('renders balance formatted in IDR', () => {
    render(<AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // formatIDR(1500000) should produce something with "1.500.000"
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
  });

  it('renders negative balance in red (text-danger)', () => {
    const negativeAccount: Account = { ...baseAccount, balance: -200000 };
    render(<AccountCard account={negativeAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const balanceEl = screen.getByText(/200\.000/);
    expect(balanceEl.className).toContain('text-danger');
  });

  it('renders CreditCardProgress for credit card accounts', () => {
    const ccAccount: Account = {
      ...baseAccount,
      type: 'credit_card',
      balance: -500000,
      credit_limit: 2000000,
      due_date: 15,
    };
    render(<AccountCard account={ccAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render CreditCardProgress for non-credit-card accounts', () => {
    render(<AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<AccountCard account={baseAccount} onEdit={onEdit} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/Edit akun BCA/));
    expect(onEdit).toHaveBeenCalledWith(baseAccount);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText(/Hapus akun BCA/));
    expect(onDelete).toHaveBeenCalledWith(baseAccount);
  });

  it('shows InvestmentPLDisplay for investment account with valid invested_amount', () => {
    const investmentAccount: Account = {
      ...baseAccount,
      name: 'Stockbit',
      type: 'investment',
      balance: 15000000,
      invested_amount: 10000000,
    };
    render(<AccountCard account={investmentAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Total Modal')).toBeInTheDocument();
    expect(screen.getByText('Keuntungan')).toBeInTheDocument();
  });

  it('hides InvestmentPLDisplay for investment account without invested_amount', () => {
    const investmentNoModal: Account = {
      ...baseAccount,
      name: 'Pluang',
      type: 'investment',
      balance: 5000000,
      invested_amount: null,
    };
    render(<AccountCard account={investmentNoModal} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('Total Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Keuntungan')).not.toBeInTheDocument();
    expect(screen.queryByText('Kerugian')).not.toBeInTheDocument();
  });

  it('does not show InvestmentPLDisplay for non-investment accounts', () => {
    render(<AccountCard account={baseAccount} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText('Total Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Keuntungan')).not.toBeInTheDocument();
    expect(screen.queryByText('Kerugian')).not.toBeInTheDocument();
  });
});
