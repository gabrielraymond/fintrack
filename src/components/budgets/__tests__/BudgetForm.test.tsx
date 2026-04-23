import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BudgetForm from '../BudgetForm';
import type { BudgetWithSpending } from '@/types';

// Mock useCategories to return test categories
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'cat-1', name: 'Makanan', icon: '🍔', user_id: 'u1', is_default: true, created_at: '' },
      { id: 'cat-2', name: 'Transport', icon: '🚗', user_id: 'u1', is_default: false, created_at: '' },
    ],
  }),
}));

const baseBudget: BudgetWithSpending = {
  id: 'budget-1',
  user_id: 'u1',
  category_id: 'cat-1',
  month: '2024-06-01',
  limit_amount: 500000,
  created_at: '2024-06-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
  spent: 100000,
  category_name: 'Makanan',
  category_icon: '🍔',
};

describe('BudgetForm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders month field as enabled in create mode', () => {
    render(<BudgetForm {...defaultProps} />);
    const monthInput = screen.getByLabelText('Bulan');
    expect(monthInput).not.toBeDisabled();
  });

  it('renders month field as enabled in edit mode', () => {
    render(<BudgetForm {...defaultProps} budget={baseBudget} />);
    const monthInput = screen.getByLabelText('Bulan');
    expect(monthInput).not.toBeDisabled();
  });

  it('populates month from budget in edit mode', () => {
    render(<BudgetForm {...defaultProps} budget={baseBudget} />);
    const monthInput = screen.getByLabelText('Bulan') as HTMLInputElement;
    expect(monthInput.value).toBe('2024-06');
  });

  it('allows changing month in edit mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BudgetForm {...defaultProps} budget={baseBudget} onSubmit={onSubmit} />);

    const monthInput = screen.getByLabelText('Bulan');
    await user.clear(monthInput);
    await user.type(monthInput, '2024-09');

    expect((monthInput as HTMLInputElement).value).toBe('2024-09');
  });

  it('submits with updated month in edit mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BudgetForm {...defaultProps} budget={baseBudget} onSubmit={onSubmit} />);

    // Change month
    const monthInput = screen.getByLabelText('Bulan');
    await user.clear(monthInput);
    await user.type(monthInput, '2024-09');

    // Submit
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onSubmit).toHaveBeenCalledWith({
      category_id: 'cat-1',
      month: '2024-09-01',
      limit_amount: 500000,
    });
  });
});
