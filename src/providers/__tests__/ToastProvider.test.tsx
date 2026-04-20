import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../ToastProvider';

function ToastTrigger() {
  const { showError, showSuccess, dismiss } = useToast();
  return (
    <div>
      <button onClick={() => showError('Gagal menyimpan')}>show error</button>
      <button onClick={() => showError('Gagal jaringan', () => {})}>show error retry</button>
      <button onClick={() => showSuccess('Berhasil')}>show success</button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(
      <ToastProvider>
        <p>child</p>
      </ToastProvider>
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('shows an error toast when showError is called', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('show error'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('shows a success toast when showSuccess is called', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('show success'));
    expect(screen.getByText('Berhasil')).toBeInTheDocument();
  });

  it('supports multiple simultaneous toasts', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('show error'));
    await user.click(screen.getByText('show success'));

    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
    expect(screen.getByText('Berhasil')).toBeInTheDocument();
  });

  it('dismisses a toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('show error'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Tutup notifikasi');
    await user.click(closeBtn);
    expect(screen.queryByText('Gagal menyimpan')).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts after timeout', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('show error').click();
    });
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Gagal menyimpan')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('throws when useToast is used outside ToastProvider', () => {
    function Orphan() {
      useToast();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(
      'useToast harus digunakan di dalam ToastProvider'
    );
  });

  it('shows retry button for error toasts with onRetry', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('show error retry'));
    expect(screen.getByLabelText('Coba lagi')).toBeInTheDocument();
  });
});
