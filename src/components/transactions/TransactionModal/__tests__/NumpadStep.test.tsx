import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import NumpadStep from '../NumpadStep';

describe('NumpadStep', () => {
  it('renders all digit buttons, backspace, and confirm', () => {
    render(<NumpadStep initialAmount={0} onConfirm={vi.fn()} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByLabelText(String(i))).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Hapus digit terakhir')).toBeInTheDocument();
    expect(screen.getByLabelText('Konfirmasi jumlah')).toBeInTheDocument();
  });

  it('displays formatted IDR amount as digits are entered', async () => {
    const user = userEvent.setup();
    render(<NumpadStep initialAmount={0} onConfirm={vi.fn()} />);

    await user.click(screen.getByLabelText('1'));
    await user.click(screen.getByLabelText('5'));
    await user.click(screen.getByLabelText('0'));
    await user.click(screen.getByLabelText('0'));
    await user.click(screen.getByLabelText('0'));

    // Should show Rp 15.000 (formatted)
    const display = screen.getByLabelText(/Jumlah:/);
    expect(display.textContent).toContain('15.000');
  });

  it('removes last digit on backspace', async () => {
    const user = userEvent.setup();
    render(<NumpadStep initialAmount={0} onConfirm={vi.fn()} />);

    await user.click(screen.getByLabelText('1'));
    await user.click(screen.getByLabelText('2'));
    await user.click(screen.getByLabelText('3'));
    await user.click(screen.getByLabelText('Hapus digit terakhir'));

    const display = screen.getByLabelText(/Jumlah:/);
    expect(display.textContent).toContain('12');
  });

  it('shows error and prevents confirm when amount is zero', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<NumpadStep initialAmount={0} onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText('Konfirmasi jumlah'));

    expect(screen.getByRole('alert')).toHaveTextContent('Jumlah tidak boleh nol');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with the entered amount', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<NumpadStep initialAmount={0} onConfirm={onConfirm} />);

    await user.click(screen.getByLabelText('5'));
    await user.click(screen.getByLabelText('0'));
    await user.click(screen.getByLabelText('0'));
    await user.click(screen.getByLabelText('0'));
    await user.click(screen.getByLabelText('Konfirmasi jumlah'));

    expect(onConfirm).toHaveBeenCalledWith(5000);
  });

  it('initializes with a pre-filled amount', () => {
    render(<NumpadStep initialAmount={25000} onConfirm={vi.fn()} />);
    const display = screen.getByLabelText(/Jumlah:/);
    expect(display.textContent).toContain('25.000');
  });
});
