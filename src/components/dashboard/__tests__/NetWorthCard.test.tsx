import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NetWorthCard from '../NetWorthCard';

describe('NetWorthCard', () => {
  it('renders total net worth as primary value with label', () => {
    render(<NetWorthCard total={5000000} operational={3000000} savings={2000000} />);
    expect(screen.getByText('Kekayaan Bersih')).toBeInTheDocument();
    expect(screen.getByLabelText(/Kekayaan bersih/)).toHaveTextContent(/5\.000\.000/);
  });

  it('renders operational balance with label', () => {
    render(<NetWorthCard total={5000000} operational={3000000} savings={2000000} />);
    expect(screen.getByText('Saldo Operasional')).toBeInTheDocument();
    expect(screen.getByLabelText(/Saldo operasional/)).toHaveTextContent(/3\.000\.000/);
  });

  it('renders savings balance with label', () => {
    render(<NetWorthCard total={5000000} operational={3000000} savings={2000000} />);
    expect(screen.getByText(/Simpanan/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Simpanan dan investasi/)).toHaveTextContent(/2\.000\.000/);
  });

  it('applies text-danger to negative total', () => {
    render(<NetWorthCard total={-1000000} operational={500000} savings={-1500000} />);
    const totalEl = screen.getByLabelText(/Kekayaan bersih/);
    expect(totalEl.className).toContain('text-danger');
  });

  it('applies text-danger to negative operational balance', () => {
    render(<NetWorthCard total={0} operational={-500000} savings={500000} />);
    const opEl = screen.getByLabelText(/Saldo operasional/);
    expect(opEl.className).toContain('text-danger');
  });

  it('applies text-danger to negative savings balance', () => {
    render(<NetWorthCard total={0} operational={500000} savings={-500000} />);
    const savEl = screen.getByLabelText(/Simpanan dan investasi/);
    expect(savEl.className).toContain('text-danger');
  });

  it('does not apply text-danger to positive values', () => {
    render(<NetWorthCard total={1000000} operational={600000} savings={400000} />);
    const totalEl = screen.getByLabelText(/Kekayaan bersih/);
    const opEl = screen.getByLabelText(/Saldo operasional/);
    const savEl = screen.getByLabelText(/Simpanan dan investasi/);
    expect(totalEl.className).not.toContain('text-danger');
    expect(opEl.className).not.toContain('text-danger');
    expect(savEl.className).not.toContain('text-danger');
  });

  it('renders zero values without text-danger', () => {
    render(<NetWorthCard total={0} operational={0} savings={0} />);
    const totalEl = screen.getByLabelText(/Kekayaan bersih/);
    expect(totalEl.className).not.toContain('text-danger');
  });
});
