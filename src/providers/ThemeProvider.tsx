'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'fintrack-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') return getSystemPreference();
  return theme;
}

function applyThemeClass(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Always start with 'system' on server to avoid hydration mismatch.
  // The inline script in <head> already sets the correct class on <html>,
  // so there's no flash. We sync state in useEffect after mount.
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Read from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    let stored: ThemeMode = 'system';
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      if (val === 'light' || val === 'dark' || val === 'system') {
        stored = val;
      }
    } catch {
      // localStorage unavailable
    }
    setThemeState(stored);
    setResolvedTheme(resolveTheme(stored));
    setMounted(true);
  }, []);

  // Apply theme class whenever resolvedTheme changes — but skip the first
  // render so we don't remove the 'dark' class set by the inline <head> script.
  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme, mounted]);

  // Listen for system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      const newResolved = resolveTheme(newTheme);
      setResolvedTheme(newResolved);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // localStorage unavailable — in-memory only
      }

      // Sync to user_profiles in background (non-blocking)
      if (user) {
        const supabase = createClient();
        supabase
          .from('user_profiles')
          .update({ theme_preference: newTheme, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .then(() => {
            // fire-and-forget
          });
      }
    },
    [user]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme harus digunakan di dalam ThemeProvider');
  }
  return context;
}
