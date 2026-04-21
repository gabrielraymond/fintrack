import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: vi.fn(() => ({ signOut: vi.fn() })),
}));

vi.mock('@/components/layout/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

import { usePathname } from 'next/navigation';

const navLabels = ['Beranda', 'Transaksi', 'Akun', 'Anggaran', 'Goals', 'Laporan', 'Pengaturan'];

describe('Sidebar', () => {
  it('renders a nav element with proper aria-label', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument();
  });

  it('renders the FinTrack brand heading', () => {
    render(<Sidebar />);
    expect(screen.getByText('FinTrack')).toBeInTheDocument();
  });

  it('renders all seven navigation items', () => {
    render(<Sidebar />);
    for (const label of navLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('marks the active route with aria-current="page"', () => {
    vi.mocked(usePathname).mockReturnValue('/budgets');
    render(<Sidebar />);
    const activeLink = screen.getByText('Anggaran').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive routes with aria-current', () => {
    vi.mocked(usePathname).mockReturnValue('/budgets');
    render(<Sidebar />);
    const inactiveLink = screen.getByText('Beranda').closest('a');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('applies custom className', () => {
    render(<Sidebar className="hidden md:flex" />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('hidden');
    expect(nav.className).toContain('md:flex');
  });

  it('renders correct hrefs for all nav items', () => {
    render(<Sidebar />);
    const expectedHrefs = ['/dashboard', '/transactions', '/accounts', '/budgets', '/goals', '/reports', '/settings'];
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(expectedHrefs);
  });
});
