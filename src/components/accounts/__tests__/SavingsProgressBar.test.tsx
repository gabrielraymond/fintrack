import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SavingsProgressBar from '../SavingsProgressBar';

describe('SavingsProgressBar', () => {
  it('renders a progressbar with correct percentage', () => {
    render(<SavingsProgressBar balance={500000} targetAmount={1000000} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows remaining amount when target not reached', () => {
    render(<SavingsProgressBar balance={300000} targetAmount={1000000} />);
    // remaining = 700000 → formatted as "Rp 700.000"
    expect(screen.getByText(/700\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Sisa/)).toBeInTheDocument();
  });

  it('shows "Tercapai" text when balance meets target (100%)', () => {
    render(<SavingsProgressBar balance={1000000} targetAmount={1000000} />);
    expect(screen.getByText(/Tercapai/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows "Tercapai" when balance exceeds target', () => {
    render(<SavingsProgressBar balance={1500000} targetAmount={1000000} />);
    expect(screen.getByText(/Tercapai/)).toBeInTheDocument();
    // percentage is 150% but bar capped at 100
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '150');
  });

  it('does not show remaining text when target is achieved', () => {
    render(<SavingsProgressBar balance={1000000} targetAmount={1000000} />);
    expect(screen.queryByText(/Sisa/)).not.toBeInTheDocument();
  });

  it('displays target amount formatted', () => {
    render(<SavingsProgressBar balance={0} targetAmount={5000000} />);
    expect(screen.getByText(/Target:.*5\.000\.000/)).toBeInTheDocument();
  });

  it('handles zero target gracefully (0%)', () => {
    render(<SavingsProgressBar balance={100000} targetAmount={0} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});
