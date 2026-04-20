import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import FAB from '../FAB';

describe('FAB', () => {
  it('renders with aria-label', () => {
    render(<FAB onClick={vi.fn()} aria-label="Tambah transaksi" />);
    expect(screen.getByLabelText('Tambah transaksi')).toBeInTheDocument();
  });

  it('is keyboard accessible with tabIndex', () => {
    render(<FAB onClick={vi.fn()} aria-label="Tambah transaksi" />);
    const btn = screen.getByLabelText('Tambah transaksi');
    expect(btn).toHaveAttribute('tabindex', '0');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FAB onClick={onClick} aria-label="Tambah transaksi" />);
    await user.click(screen.getByLabelText('Tambah transaksi'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders custom children', () => {
    render(
      <FAB onClick={vi.fn()} aria-label="Custom">
        <span>+</span>
      </FAB>
    );
    expect(screen.getByText('+')).toBeInTheDocument();
  });
});
