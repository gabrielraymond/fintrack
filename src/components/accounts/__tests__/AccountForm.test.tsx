import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import AccountForm from '../AccountForm';
import type { Account, AccountType } from '@/types';
import { ACCOUNT_TYPES } from '@/lib/constants';

// Mock createPortal for Modal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('AccountForm', () => {
  it('renders create mode title when no account provided', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByText('Tambah Akun')).toBeInTheDocument();
  });

  it('renders edit mode title when account is provided', () => {
    const account: Account = {
      id: '1',
      user_id: 'u1',
      name: 'BCA',
      type: 'bank',
      balance: 100000,
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
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} account={account} />,
    );
    expect(screen.getByText('Edit Akun')).toBeInTheDocument();
  });

  it('shows credit card fields when credit_card type is selected', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    // Select credit_card type
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'credit_card' },
    });
    expect(screen.getByLabelText(/Limit Kredit/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tanggal Jatuh Tempo/)).toBeInTheDocument();
  });

  it('hides credit card fields for non-credit-card types', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.queryByLabelText(/Limit Kredit/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Tanggal Jatuh Tempo/)).not.toBeInTheDocument();
  });

  it('calls onSubmit with form data on submit', () => {
    const onSubmit = vi.fn();
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText('Nama Akun'), {
      target: { value: 'GoPay' },
    });
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'e-wallet' },
    });
    fireEvent.change(screen.getByLabelText(/Saldo Awal/), {
      target: { value: '500000' },
    });

    fireEvent.click(screen.getByText('Tambah'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'GoPay',
      type: 'e-wallet',
      balance: 500000,
    });
  });

  it('disables submit button when name is empty', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    const submitBtn = screen.getByText('Tambah');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(
      <AccountForm open={true} onClose={onClose} onSubmit={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows target_amount field when tabungan type is selected', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'tabungan' },
    });
    expect(screen.getByLabelText(/Target Tabungan/)).toBeInTheDocument();
  });

  it('shows target_amount field when dana_darurat type is selected', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'dana_darurat' },
    });
    expect(screen.getByLabelText(/Target Tabungan/)).toBeInTheDocument();
  });

  it('hides target_amount field for non-savings types', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.queryByLabelText(/Target Tabungan/)).not.toBeInTheDocument();
  });

  it('includes target_amount in onSubmit data for tabungan type', () => {
    const onSubmit = vi.fn();
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText('Nama Akun'), {
      target: { value: 'Tabungan Liburan' },
    });
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'tabungan' },
    });
    fireEvent.change(screen.getByLabelText(/Saldo Awal/), {
      target: { value: '1000000' },
    });
    fireEvent.change(screen.getByLabelText(/Target Tabungan/), {
      target: { value: '5000000' },
    });

    fireEvent.click(screen.getByText('Tambah'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Tabungan Liburan',
      type: 'tabungan',
      balance: 1000000,
      target_amount: 5000000,
    });
  });

  // ============================================================
  // invested_amount field tests
  // ============================================================

  it('shows invested_amount field when investment type is selected', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'investment' },
    });
    expect(screen.getByLabelText(/Modal Investasi/)).toBeInTheDocument();
  });

  it('hides invested_amount field for non-investment types', () => {
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    // Default type is 'bank'
    expect(screen.queryByLabelText(/Modal Investasi/)).not.toBeInTheDocument();
  });

  it('includes invested_amount in onSubmit data for investment type', () => {
    const onSubmit = vi.fn();
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText('Nama Akun'), {
      target: { value: 'Pluang Crypto' },
    });
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'investment' },
    });
    fireEvent.change(screen.getByLabelText(/Saldo Awal/), {
      target: { value: '15000000' },
    });
    fireEvent.change(screen.getByLabelText(/Modal Investasi/), {
      target: { value: '10000000' },
    });

    fireEvent.click(screen.getByText('Tambah'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Pluang Crypto',
      type: 'investment',
      balance: 15000000,
      invested_amount: 10000000,
    });
  });

  it('does not call onSubmit when invested_amount is negative', () => {
    const onSubmit = vi.fn();
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText('Nama Akun'), {
      target: { value: 'Bad Investment' },
    });
    fireEvent.change(screen.getByLabelText('Tipe Akun'), {
      target: { value: 'investment' },
    });
    fireEvent.change(screen.getByLabelText(/Saldo Awal/), {
      target: { value: '5000000' },
    });
    fireEvent.change(screen.getByLabelText(/Modal Investasi/), {
      target: { value: '-100' },
    });

    fireEvent.click(screen.getByText('Tambah'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('populates invested_amount from account data in edit mode', () => {
    const account: Account = {
      id: '2',
      user_id: 'u1',
      name: 'Stockbit',
      type: 'investment',
      balance: 12000000,
      credit_limit: null,
      due_date: null,
      target_amount: null,
      gold_brand: null,
      gold_weight_grams: null,
      gold_purchase_price_per_gram: null,
      invested_amount: 10000000,
      is_deleted: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    render(
      <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} account={account} />,
    );
    const input = screen.getByLabelText(/Modal Investasi/) as HTMLInputElement;
    expect(input.value).toBe('10000000');
  });
});

/**
 * Property Tests for AccountForm invested_amount field
 *
 * Property 4: Negative Invested Amount Rejection
 * Property 5: Form Field Visibility by Account Type
 *
 * Feature: investment-profit-loss-tracking
 * Validates: Requirements 1.2, 1.3, 5.4
 */

describe('Property 4: Negative Invested Amount Rejection', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * For any negative number provided as invested_amount in the AccountForm,
   * the form should reject the submission and not call onSubmit.
   */
  it('should not call onSubmit when invested_amount is any negative number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: -1 }), // negative invested amounts
        (negativeAmount) => {
          const onSubmit = vi.fn();
          const { unmount } = render(
            <AccountForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
          );

          fireEvent.change(screen.getByLabelText('Nama Akun'), {
            target: { value: 'Test Investment' },
          });
          fireEvent.change(screen.getByLabelText('Tipe Akun'), {
            target: { value: 'investment' },
          });
          fireEvent.change(screen.getByLabelText(/Saldo Awal/), {
            target: { value: '1000000' },
          });
          fireEvent.change(screen.getByLabelText(/Modal Investasi/), {
            target: { value: String(negativeAmount) },
          });

          fireEvent.click(screen.getByText('Tambah'));

          expect(onSubmit).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Form Field Visibility by Account Type', () => {
  /**
   * **Validates: Requirements 1.2, 1.3**
   *
   * For any account type value, the "Modal Investasi" field should be
   * visible if and only if the type is 'investment'.
   */
  it('Modal Investasi field should be visible only when type is investment', () => {
    const allAccountTypes = ACCOUNT_TYPES.map((t) => t.value);

    fc.assert(
      fc.property(
        fc.constantFrom(...allAccountTypes), // pick any account type
        (accountType: AccountType) => {
          const { unmount } = render(
            <AccountForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
          );

          fireEvent.change(screen.getByLabelText('Tipe Akun'), {
            target: { value: accountType },
          });

          const investedAmountField = screen.queryByLabelText(/Modal Investasi/);

          if (accountType === 'investment') {
            expect(investedAmountField).toBeInTheDocument();
          } else {
            expect(investedAmountField).not.toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
