import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BottomNav from '../BottomNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

import { usePathname } from 'next/navigation';

const navLabels = ['Beranda', 'Transaksi', 'Akun', 'Anggaran', 'Pengaturan'];

describe('BottomNav', () => {
  it('renders a nav element with proper aria-label', () => {
    render(<BottomNav />);
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument();
  });

  it('renders all five navigation items in Bahasa Indonesia', () => {
    render(<BottomNav />);
    for (const label of navLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('marks the active route with aria-current="page"', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<BottomNav />);
    const activeLink = screen.getByText('Beranda').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive routes with aria-current', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<BottomNav />);
    const inactiveLink = screen.getByText('Transaksi').closest('a');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('applies custom className', () => {
    render(<BottomNav className="md:hidden" />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('md:hidden');
  });

  it('highlights active item for nested routes', () => {
    vi.mocked(usePathname).mockReturnValue('/accounts/123');
    render(<BottomNav />);
    const activeLink = screen.getByText('Akun').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders correct hrefs for all nav items', () => {
    render(<BottomNav />);
    const expectedHrefs = ['/dashboard', '/transactions', '/accounts', '/budgets', '/settings'];
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(expectedHrefs);
  });
});
