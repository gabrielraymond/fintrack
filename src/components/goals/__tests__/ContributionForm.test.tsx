import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributionForm from '../ContributionForm';

// Mock createPortal for Modal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('ContributionForm', () => {
  it('renders add mode title', () => {
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="add"
        currentAmount={1000000}
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
      />,
    );
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
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '500000' },
    });
    fireEvent.click(screen.getByText('Tarik'));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 500000 });
  });

  it('calls onSubmit with valid add data', () => {
    const onSubmit = vi.fn();
    render(
      <ContributionForm
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        mode="add"
        currentAmount={0}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Jumlah/), {
      target: { value: '250000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(onSubmit).toHaveBeenCalledWith({ amount: 250000 });
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
      />,
    );
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
      />,
    );
    expect(screen.queryByText('Tambah Kontribusi')).not.toBeInTheDocument();
  });
});
