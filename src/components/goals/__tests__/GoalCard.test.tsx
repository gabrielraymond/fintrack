import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalCard from '../GoalCard';
import type { FinancialGoal } from '@/types';

const baseGoal: FinancialGoal = {
  id: 'g1',
  user_id: 'u1',
  name: 'Liburan Bali',
  category: 'liburan',
  target_amount: 10000000,
  current_amount: 5000000,
  target_date: null,
  note: null,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('GoalCard', () => {
  it('renders goal name and category icon', () => {
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Liburan Bali')).toBeInTheDocument();
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('renders current and target amounts formatted in IDR', () => {
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage', () => {
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows remaining days when target_date is set', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const goalWithDate: FinancialGoal = {
      ...baseGoal,
      target_date: futureDate.toISOString().split('T')[0],
    };
    render(<GoalCard goal={goalWithDate} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/30 hari lagi/)).toBeInTheDocument();
  });

  it('shows overdue text when target_date has passed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const goalOverdue: FinancialGoal = {
      ...baseGoal,
      target_date: pastDate.toISOString().split('T')[0],
    };
    render(<GoalCard goal={goalOverdue} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/5 hari terlewat/)).toBeInTheDocument();
  });

  it('shows completed state with checkmark and success message', () => {
    const completedGoal: FinancialGoal = {
      ...baseGoal,
      status: 'completed',
      current_amount: 10000000,
    };
    render(<GoalCard goal={completedGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Tercapai! 🎉/)).toBeInTheDocument();
    expect(screen.getByLabelText('Tercapai')).toBeInTheDocument();
  });

  it('shows cancelled state with dimmed appearance', () => {
    const cancelledGoal: FinancialGoal = { ...baseGoal, status: 'cancelled' };
    render(<GoalCard goal={cancelledGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    // Card should have opacity-50 class
    const card = screen.getByRole('progressbar').closest('.rounded-xl');
    expect(card?.className).toContain('opacity-50');
  });

  it('hides cancel button for completed and cancelled goals', () => {
    const completedGoal: FinancialGoal = { ...baseGoal, status: 'completed', current_amount: 10000000 };
    const { rerender } = render(<GoalCard goal={completedGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText(/Batalkan goal/)).not.toBeInTheDocument();

    const cancelledGoal: FinancialGoal = { ...baseGoal, status: 'cancelled' };
    rerender(<GoalCard goal={cancelledGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText(/Batalkan goal/)).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<GoalCard goal={baseGoal} onEdit={onEdit} onDelete={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/Edit goal Liburan Bali/));
    expect(onEdit).toHaveBeenCalledWith(baseGoal);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={onDelete} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/Hapus goal Liburan Bali/));
    expect(onDelete).toHaveBeenCalledWith(baseGoal);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText(/Batalkan goal Liburan Bali/));
    expect(onCancel).toHaveBeenCalledWith(baseGoal);
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<GoalCard goal={baseGoal} onEdit={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} onClick={onClick} />);
    fireEvent.click(screen.getByText('Liburan Bali'));
    expect(onClick).toHaveBeenCalledWith(baseGoal);
  });
});
