import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributionForm from '../ContributionForm';
import type { Account } from '@/types';

// Mock createPortal for Modal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('@/hooks/useFormatIDR', () => ({
  useFormatIDR: () => (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`,
}));

const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'BCA',
    type: 'bank',
    balance: 5000000,
    credit_limit: null,
    due_date: null,
    target_amount: null,
    gold_brand: null,
    gold_weight_grams: null,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    user_id: 'user-1',
    name: 'GoPay',
    type: 'e-wallet',
    balance: 1000000,
    credit_limit: null,
    due_date: null,
    target_amount: null,
    gold_brand: null,
    gold_weight_grams: null,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('ContributionForm', () => {
  it('renders add mode title', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={1000000}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByText('Tambah Kontribusi')).toBeInTheDocument();
  });

  it('renders withdraw mode title', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="withdraw"
        currentAmount={1000000}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByText('Tarik Dana')).toBeInTheDocument();
  });

  it('renders amount and note fields', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByLabelText(/Jumlah/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catatan/)).toBeInTheDocument();
  });

  it('shows "Tambah" submit button in add mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByText('Tambah')).toBeInTheDocument();
  });

  it('shows "Tarik" submit button in withdraw mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="withdraw"
        currentAmount={1000000}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByText('Tarik')).toBeInTheDocument();
  });

  it('shows error when amount is 0 on submit', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Jumlah harus lebih besar dari 0')).toBeInTheDocument();
  });

  it('shows error when amount is negative on submit', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '-100' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Jumlah harus lebih besar dari 0')).toBeInTheDocument();
  });

  it('shows error when amount is empty on submit', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Jumlah harus lebih besar dari 0')).toBeInTheDocument();
  });

  it('shows error when withdraw amount exceeds currentAmount', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="withdraw"
        currentAmount={500000}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Pilih Akun Tujuan/), {
      target: { value: 'acc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '600000' },
    });
    fireEvent.click(screen.getByText('Tarik'));
    expect(screen.getByText('Jumlah penarikan melebihi saldo goal')).toBeInTheDocument();
  });

  it('allows withdraw when amount equals currentAmount', () => {
    const onSubmit = vi.fn();
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        mode="withdraw"
        currentAmount={500000}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Pilih Akun Tujuan/), {
      target: { value: 'acc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '500000' },
    });
    fireEvent.click(screen.getByText('Tarik'));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 500000, account_id: 'acc-1' });
  });

  it('calls onSubmit with valid add data including account_id', () => {
    const onSubmit = vi.fn();
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Pilih Akun Sumber/), {
      target: { value: 'acc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '250000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 250000, account_id: 'acc-1' });
  });

  it('includes note when provided', () => {
    const onSubmit = vi.fn();
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Pilih Akun Sumber/), {
      target: { value: 'acc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '100000' },
    });
    fireEvent.change(screen.getByLabelText(/Catatan/), {
      target: { value: 'Gaji bulanan' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(onSubmit).toHaveBeenCalledWith({
      amount: 100000,
      note: 'Gaji bulanan',
      account_id: 'acc-1',
    });
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(
      <ContributionForm
        open={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    render(
      <ContributionForm
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    expect(screen.queryByText('Tambah Kontribusi')).not.toBeInTheDocument();
  });

  // --- Account dropdown tests (Task 4.1) ---

  it('renders "Pilih Akun Sumber" dropdown in add mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByLabelText('Pilih Akun Sumber')).toBeInTheDocument();
  });

  it('renders "Pilih Akun Tujuan" dropdown in withdraw mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="withdraw"
        currentAmount={1000000}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByLabelText('Pilih Akun Tujuan')).toBeInTheDocument();
  });

  it('shows account name and formatted balance in dropdown options', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    expect(screen.getByText(/BCA — Rp/)).toBeInTheDocument();
    expect(screen.getByText(/GoPay — Rp/)).toBeInTheDocument();
  });

  it('filters out deleted accounts from dropdown', () => {
    const accountsWithDeleted: Account[] = [
      ...mockAccounts,
      {
        id: 'acc-3',
        user_id: 'user-1',
        name: 'Deleted Account',
        type: 'cash',
        balance: 0,
        credit_limit: null,
        due_date: null,
        target_amount: null,
        gold_brand: null,
        gold_weight_grams: null,
        is_deleted: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={accountsWithDeleted}
      />,
    );
    expect(screen.queryByText(/Deleted Account/)).not.toBeInTheDocument();
  });

  // --- Account validation tests (Task 4.2) ---

  it('shows error when no account selected in add mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '100000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Pilih akun sumber terlebih dahulu')).toBeInTheDocument();
  });

  it('shows error when no account selected in withdraw mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="withdraw"
        currentAmount={1000000}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '100000' },
    });
    fireEvent.click(screen.getByText('Tarik'));
    expect(screen.getByText('Pilih akun tujuan terlebih dahulu')).toBeInTheDocument();
  });

  it('shows insufficient balance error in add mode', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={0}
        accounts={mockAccounts}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Pilih Akun Sumber/), {
      target: { value: 'acc-2' },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '2000000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Saldo akun tidak mencukupi')).toBeInTheDocument();
  });
});
