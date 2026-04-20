import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ConfirmationDialog from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Hapus Transaksi',
    description: 'Apakah Anda yakin ingin menghapus transaksi ini?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and description', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText('Hapus Transaksi')).toBeInTheDocument();
    expect(screen.getByText('Apakah Anda yakin ingin menghapus transaksi ini?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmationDialog {...defaultProps} />);
    expect(screen.getByText('Konfirmasi')).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText('Konfirmasi'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByText('Batal'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables confirm button until typed confirmation matches', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmationDialog
        {...defaultProps}
        onConfirm={onConfirm}
        requireTypedConfirmation="HAPUS"
      />
    );

    expect(screen.getByText('Konfirmasi')).toBeDisabled();

    const input = screen.getByLabelText(/Ketik HAPUS untuk mengonfirmasi/) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'HAPUS');
    // Verify the input value was set correctly
    expect(input.value).toBe('HAPUS');
    expect(screen.getByText('Konfirmasi')).not.toBeDisabled();

    await user.click(screen.getByText('Konfirmasi'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does not render when closed', () => {
    render(<ConfirmationDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
