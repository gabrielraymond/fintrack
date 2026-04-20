import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TypeStep from '../TypeStep';

describe('TypeStep', () => {
  it('renders all three transaction type options', () => {
    render(<TypeStep onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Pemasukan')).toBeInTheDocument();
    expect(screen.getByLabelText('Pengeluaran')).toBeInTheDocument();
    expect(screen.getByLabelText('Transfer')).toBeInTheDocument();
  });

  it('calls onSelect with "income" when Pemasukan is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TypeStep onSelect={onSelect} />);
    await user.click(screen.getByLabelText('Pemasukan'));
    expect(onSelect).toHaveBeenCalledWith('income');
  });

  it('calls onSelect with "expense" when Pengeluaran is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TypeStep onSelect={onSelect} />);
    await user.click(screen.getByLabelText('Pengeluaran'));
    expect(onSelect).toHaveBeenCalledWith('expense');
  });

  it('calls onSelect with "transfer" when Transfer is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TypeStep onSelect={onSelect} />);
    await user.click(screen.getByLabelText('Transfer'));
    expect(onSelect).toHaveBeenCalledWith('transfer');
  });
});
