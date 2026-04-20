import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders default Bahasa Indonesia messages', () => {
    render(<EmptyState />);
    expect(screen.getByText('Belum ada data')).toBeInTheDocument();
    expect(screen.getByText('Data yang Anda cari belum tersedia.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="Belum ada transaksi"
        description="Mulai catat transaksi pertama Anda."
      />
    );
    expect(screen.getByText('Belum ada transaksi')).toBeInTheDocument();
    expect(screen.getByText('Mulai catat transaksi pertama Anda.')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState actionLabel="Tambah Akun" onAction={onAction} />
    );
    expect(screen.getByRole('button', { name: 'Tambah Akun' })).toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState actionLabel="Tambah" onAction={onAction} />
    );
    await user.click(screen.getByRole('button', { name: 'Tambah' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not render action button when no actionLabel', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
