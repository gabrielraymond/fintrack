import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResponsiveShell from '../ResponsiveShell';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
}));

describe('ResponsiveShell', () => {
  it('renders children inside main element', () => {
    render(<ResponsiveShell><div data-testid="child">Content</div></ResponsiveShell>);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders both Sidebar and BottomNav navigation elements', () => {
    render(<ResponsiveShell><div>Content</div></ResponsiveShell>);
    const navs = screen.getAllByRole('navigation', { name: 'Navigasi utama' });
    expect(navs).toHaveLength(2);
  });

  it('hides Sidebar on mobile via hidden md:flex classes', () => {
    render(<ResponsiveShell><div>Content</div></ResponsiveShell>);
    const navs = screen.getAllByRole('navigation', { name: 'Navigasi utama' });
    // Sidebar is the one with hidden md:flex
    const sidebar = navs.find((n) => n.className.includes('hidden') && n.className.includes('md:flex'));
    expect(sidebar).toBeDefined();
  });

  it('hides BottomNav on desktop via md:hidden class', () => {
    render(<ResponsiveShell><div>Content</div></ResponsiveShell>);
    const navs = screen.getAllByRole('navigation', { name: 'Navigasi utama' });
    const bottomNav = navs.find((n) => n.className.includes('md:hidden'));
    expect(bottomNav).toBeDefined();
  });

  it('applies bottom padding to main for mobile BottomNav space', () => {
    render(<ResponsiveShell><div>Content</div></ResponsiveShell>);
    const main = screen.getByRole('main');
    expect(main.className).toContain('pb-16');
    expect(main.className).toContain('md:pb-0');
  });
});
