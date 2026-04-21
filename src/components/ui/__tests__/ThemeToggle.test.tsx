import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';

const mockSetTheme = vi.fn();

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'system' as const, resolvedTheme: 'light' as const, setTheme: mockSetTheme }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders three theme options (Terang, Gelap, Sistem)', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Terang' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gelap' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sistem' })).toBeInTheDocument();
  });

  it('marks the current theme as checked', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: 'Sistem' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Terang' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls setTheme with "dark" when Gelap is clicked', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('radio', { name: 'Gelap' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with "light" when Terang is clicked', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('radio', { name: 'Terang' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('renders compact mode with cycle button', () => {
    render(<ThemeToggle compact />);
    // In compact mode, there's a single button that cycles themes
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('Tema:'));
  });

  it('cycles theme on compact button click (system → light)', () => {
    render(<ThemeToggle compact />);
    fireEvent.click(screen.getByRole('button'));
    // system → light (next in cycle: light → dark → system)
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
