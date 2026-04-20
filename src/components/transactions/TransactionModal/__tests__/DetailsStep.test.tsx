import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DetailsStep from '../DetailsStep';

describe('DetailsStep', () => {
  const defaultProps = {
    initialNote: '',
    initialDate: new Date(),
    isSubmitting: false,
    onConfirm: vi.fn(),
  };

  it('renders note input and date picker', () => {
    render(<DetailsStep {...defaultProps} />);
    expect(screen.getByLabelText('Catatan transaksi')).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal transaksi')).toBeInTheDocument();
    expect(screen.getByLabelText('Simpan transaksi')).toBeInTheDocument();
  });

  it('calls onConfirm with note and date on submit', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const today = new Date();
    render(<DetailsStep {...defaultProps} initialDate={today} onConfirm={onConfirm} />);

    await user.type(screen.getByLabelText('Catatan transaksi'), 'Makan siang');
    await user.click(screen.getByLabelText('Simpan transaksi'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toBe('Makan siang');
    expect(onConfirm.mock.calls[0][1]).toBeInstanceOf(Date);
  });

  it('shows validation error for future dates', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<DetailsStep {...defaultProps} onConfirm={onConfirm} />);

    const dateInput = screen.getByLabelText('Tanggal transaksi');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    await user.clear(dateInput);
    await user.type(dateInput, futureDateStr);

    expect(screen.getByRole('alert')).toHaveTextContent('Tanggal tidak boleh di masa depan');
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<DetailsStep {...defaultProps} isSubmitting={true} />);
    const btn = screen.getByLabelText('Simpan transaksi');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Menyimpan...');
  });

  it('pre-fills note from initialNote', () => {
    render(<DetailsStep {...defaultProps} initialNote="Test note" />);
    expect(screen.getByLabelText('Catatan transaksi')).toHaveValue('Test note');
  });
});
