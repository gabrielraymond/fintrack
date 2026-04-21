import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalForm from '../GoalForm';
import type { FinancialGoal } from '@/types';

// Mock createPortal for Modal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const mockGoal: FinancialGoal = {
  id: 'g1',
  user_id: 'u1',
  name: 'Liburan Bali',
  category: 'liburan',
  target_amount: 5000000,
  current_amount: 1000000,
  target_date: '2026-12-31',
  note: 'Liburan akhir tahun',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('GoalForm', () => {
  it('renders create mode title when no goal provided', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByText('Tambah Goal')).toBeInTheDocument();
  });

  it('renders edit mode title when goal is provided', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} goal={mockGoal} />,
    );
    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText('Nama Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Kategori')).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Nominal/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tanggal Target/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catatan/)).toBeInTheDocument();
  });

  it('renders all 6 category options', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    const select = screen.getByLabelText('Kategori') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual([
      'tabungan',
      'dana_darurat',
      'liburan',
      'pendidikan',
      'pelunasan_hutang',
      'lainnya',
    ]);
  });

  it('pre-fills form data in edit mode', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} goal={mockGoal} />,
    );
    expect(screen.getByLabelText('Nama Goal')).toHaveValue('Liburan Bali');
    expect(screen.getByLabelText('Kategori')).toHaveValue('liburan');
    expect(screen.getByLabelText(/Target Nominal/)).toHaveValue(5000000);
    expect(screen.getByLabelText(/Tanggal Target/)).toHaveValue('2026-12-31');
    expect(screen.getByLabelText(/Catatan/)).toHaveValue('Liburan akhir tahun');
  });

  it('shows error when name is empty on submit', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText(/Target Nominal/), {
      target: { value: '1000000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Nama goal tidak boleh kosong')).toBeInTheDocument();
  });

  it('shows error when target_amount is 0 on submit', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Nama Goal'), {
      target: { value: 'Test Goal' },
    });
    fireEvent.change(screen.getByLabelText(/Target Nominal/), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Target nominal harus lebih besar dari 0')).toBeInTheDocument();
  });

  it('shows error when target_date is in the past', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Nama Goal'), {
      target: { value: 'Test Goal' },
    });
    fireEvent.change(screen.getByLabelText(/Target Nominal/), {
      target: { value: '1000000' },
    });
    fireEvent.change(screen.getByLabelText(/Tanggal Target/), {
      target: { value: '2020-01-01' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(screen.getByText('Tanggal target harus di masa depan')).toBeInTheDocument();
  });

  it('calls onSubmit with valid data', () => {
    const onSubmit = vi.fn();
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText('Nama Goal'), {
      target: { value: 'Dana Darurat' },
    });
    fireEvent.change(screen.getByLabelText('Kategori'), {
      target: { value: 'dana_darurat' },
    });
    fireEvent.change(screen.getByLabelText(/Target Nominal/), {
      target: { value: '10000000' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Dana Darurat',
      category: 'dana_darurat',
      target_amount: 10000000,
    });
  });

  it('includes optional fields when provided', () => {
    const onSubmit = vi.fn();
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText('Nama Goal'), {
      target: { value: 'Liburan' },
    });
    fireEvent.change(screen.getByLabelText(/Target Nominal/), {
      target: { value: '5000000' },
    });
    fireEvent.change(screen.getByLabelText(/Tanggal Target/), {
      target: { value: '2026-06-01' },
    });
    fireEvent.change(screen.getByLabelText(/Catatan/), {
      target: { value: 'Trip ke Jepang' },
    });
    fireEvent.click(screen.getByText('Tambah'));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Liburan',
      category: 'tabungan',
      target_amount: 5000000,
      target_date: '2026-06-01',
      note: 'Trip ke Jepang',
    });
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(
      <GoalForm open={true} onClose={onClose} onSubmit={vi.fn()} />,
    );
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows Simpan button text in edit mode', () => {
    render(
      <GoalForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} goal={mockGoal} />,
    );
    expect(screen.getByText('Simpan')).toBeInTheDocument();
  });
});
