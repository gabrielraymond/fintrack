import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReportSummaryCard from '../ReportSummaryCard';

describe('ReportSummaryCard', () => {
  it('renders income, expenses, and net change labels in Bahasa Indonesia', () => {
    render(<ReportSummaryCard totalIncome={0} totalExpenses={0} netChange={0} />);
    expect(screen.getByText('Pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Pengeluaran')).toBeInTheDocument();
    expect(screen.getByText('Selisih Bersih')).toBeInTheDocument();
  });

  it('displays all three values in IDR format', () => {
    render(
      <ReportSummaryCard totalIncome={1500000} totalExpenses={800000} netChange={700000} />,
    );
    expect(screen.getByText('Rp 1.500.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 800.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 700.000')).toBeInTheDocument();
  });

  it('applies green color for positive net change', () => {
    render(
      <ReportSummaryCard totalIncome={2000000} totalExpenses={800000} netChange={1200000} />,
    );
    const netEl = screen.getByText('Rp 1.200.000');
    expect(netEl.className).toContain('text-success');
  });

  it('applies red color for negative net change', () => {
    render(
      <ReportSummaryCard totalIncome={500000} totalExpenses={1000000} netChange={-500000} />,
    );
    const netEl = screen.getByText('-Rp 500.000');
    expect(netEl.className).toContain('text-danger');
  });

  it('applies green color when net change is zero', () => {
    render(
      <ReportSummaryCard totalIncome={100000} totalExpenses={100000} netChange={0} />,
    );
    const netEl = screen.getByText('Rp 0');
    expect(netEl.className).toContain('text-success');
  });
});
