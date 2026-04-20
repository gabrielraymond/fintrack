import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ErrorToast from '../ErrorToast';

describe('ErrorToast', () => {
  it('renders error message with alert role', () => {
    render(<ErrorToast message="Gagal menyimpan" onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorToast message="Error" onRetry={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText('Coba lagi')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorToast message="Error" onDismiss={vi.fn()} />);
    expect(screen.queryByLabelText('Coba lagi')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorToast message="Error" onRetry={onRetry} onDismiss={vi.fn()} />);
    await user.click(screen.getByLabelText('Coba lagi'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when close button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorToast message="Error" onDismiss={onDismiss} />);
    await user.click(screen.getByLabelText('Tutup notifikasi'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('auto-dismisses after timeout', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<ErrorToast message="Error" onDismiss={onDismiss} autoDismissMs={1000} />);

    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
