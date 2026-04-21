'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const STORAGE_KEY = 'fintrack-privacy';

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  // Always start false on server to avoid hydration mismatch
  const [privacyMode, setPrivacyMode] = useState(false);

  // Sync from sessionStorage after mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
        setPrivacyMode(true);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(privacyMode));
    } catch {
      // sessionStorage unavailable — fallback to in-memory only
    }
  }, [privacyMode]);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode((prev) => !prev);
  }, []);

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy harus digunakan di dalam PrivacyProvider');
  }
  return context;
}
