import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvestmentPLDisplay from '../InvestmentPLDisplay';

vi.mock('@/hooks/useFormatIDR', () => ({
  useFormatIDR: () => (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`,
}));

describe('InvestmentPLDisplay', () => {
  it('renders profit case with green color and "+" prefix', () => {
    // balance 15M, invested 10M → profit 5M (50%)
    render(<InvestmentPLDisplay balance={15000000} investedAmount={10000000} />);

    expect(screen.getByText('Total Modal')).toBeInTheDocument();
    expect(screen.getByText('Rp 10.000.000')).toBeInTheDocument();

    expect(screen.getByText('Nilai Saat Ini')).toBeInTheDocument();
    expect(screen.getByText('Rp 15.000.000')).toBeInTheDocument();

    expect(screen.getByText('Keuntungan')).toBeInTheDocument();

    const plValue = screen.getByText('+Rp 5.000.000');
    expect(plValue).toBeInTheDocument();
    expect(plValue).toHaveClass('text-success');

    const plPercentage = screen.getByText('(+50.00%)');
    expect(plPercentage).toBeInTheDocument();
    expect(plPercentage).toHaveClass('text-success');
  });

  it('renders loss case with red color and no prefix', () => {
    // balance 8M, invested 10M → loss -2M (-20%)
    render(<InvestmentPLDisplay balance={8000000} investedAmount={10000000} />);

    expect(screen.getByText('Total Modal')).toBeInTheDocument();
    expect(screen.getByText('Rp 10.000.000')).toBeInTheDocument();

    expect(screen.getByText('Nilai Saat Ini')).toBeInTheDocument();
    expect(screen.getByText('Rp 8.000.000')).toBeInTheDocument();

    expect(screen.getByText('Kerugian')).toBeInTheDocument();

    const plValue = screen.getByText('Rp -2.000.000');
    expect(plValue).toBeInTheDocument();
    expect(plValue).toHaveClass('text-danger');

    const plPercentage = screen.getByText('(-20.00%)');
    expect(plPercentage).toBeInTheDocument();
    expect(plPercentage).toHaveClass('text-danger');
  });

  it('renders break-even case with green color and "+" prefix', () => {
    // balance 10M, invested 10M → P/L 0 (0%)
    render(<InvestmentPLDisplay balance={10000000} investedAmount={10000000} />);

    expect(screen.getByText('Total Modal')).toBeInTheDocument();
    expect(screen.getByText('Keuntungan')).toBeInTheDocument();

    const plValue = screen.getByText('+Rp 0');
    expect(plValue).toBeInTheDocument();
    expect(plValue).toHaveClass('text-success');

    const plPercentage = screen.getByText('(+0.00%)');
    expect(plPercentage).toBeInTheDocument();
    expect(plPercentage).toHaveClass('text-success');
  });
});
