import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock useFormatIDR to return the real formatIDR by default (no privacy mode in tests)
vi.mock('@/hooks/useFormatIDR', async () => {
  const actual = await vi.importActual<typeof import('@/lib/formatters')>('@/lib/formatters');
  return {
    useFormatIDR: () => actual.formatIDR,
  };
});

// Mock usePrivacy to return default (non-private) state
vi.mock('@/providers/PrivacyProvider', () => ({
  usePrivacy: () => ({ privacyMode: false, togglePrivacy: vi.fn() }),
  PrivacyProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useTheme to return default state
vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'system' as const, resolvedTheme: 'light' as const, setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
