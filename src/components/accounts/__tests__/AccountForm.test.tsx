import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountForm from '../AccountForm';
import type { Account } from '@/types';

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
});
