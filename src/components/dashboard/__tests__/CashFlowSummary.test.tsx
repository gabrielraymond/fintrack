import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CashFlowSummary from '../CashFlowSummary';

describe('CashFlowSummary', () => {
  it('renders income, expenses, and net change labels', () => {
    render(<CashFlowSummary totalIncome={0} totalExpenses={0} netChange={0} />);
    expect(screen.getByText('Pemasukan')).toBeInTheDocument();
    expect(screen.getByText('Pengeluaran')).toBeInTheDocument();
    expect(screen.getByText('Selisih')).toBeInTheDocument();
  });

  it('displays all three values in IDR format', () => {
    render(
      <CashFlowSummary totalIncome={1500000} totalExpenses={800000} netChange={700000} />,
    );
    expect(screen.getByText('Rp 1.500.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 800.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 700.000')).toBeInTheDocument();
  });

  it('applies green color (text-success) for positive net change', () => {
    render(
      <CashFlowSummary totalIncome={2000000} totalExpenses={800000} netChange={1200000} />,
    );
    const netEl = screen.getByText('Rp 1.200.000');
    expect(netEl.className).toContain('text-success');
  });

  it('applies red color (text-danger) for negative net change', () => {
    render(
      <CashFlowSummary totalIncome={500000} totalExpenses={1000000} netChange={-500000} />,
    );
    const netEl = screen.getByText('-Rp 500.000');
    expect(netEl.className).toContain('text-danger');
  });

  it('applies green color when net change is zero', () => {
    render(
      <CashFlowSummary totalIncome={100000} totalExpenses={100000} netChange={0} />,
    );
    const netEl = screen.getByText('Rp 0');
    expect(netEl.className).toContain('text-success');
  });

  it('always shows income in green and expenses in red', () => {
    render(
      <CashFlowSummary totalIncome={5000000} totalExpenses={3000000} netChange={2000000} />,
    );
    const incomeEl = screen.getByText('Rp 5.000.000');
    const expenseEl = screen.getByText('Rp 3.000.000');
    expect(incomeEl.className).toContain('text-success');
    expect(expenseEl.className).toContain('text-danger');
  });

  it('has accessible group role with label', () => {
    render(<CashFlowSummary totalIncome={0} totalExpenses={0} netChange={0} />);
    expect(screen.getByRole('group', { name: /ringkasan arus kas/i })).toBeInTheDocument();
  });
});
