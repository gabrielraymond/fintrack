'use client';

import React from 'react';
import { usePrivacy } from '@/providers/PrivacyProvider';

export interface PrivacyToggleProps {
  className?: string;
}

export default function PrivacyToggle({ className }: PrivacyToggleProps) {
  const { privacyMode, togglePrivacy } = usePrivacy();

  return (
    <button
      type="button"
      onClick={togglePrivacy}
      className={`p-2 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors ${className ?? ''}`}
      aria-label={privacyMode ? 'Tampilkan nilai moneter' : 'Sembunyikan nilai moneter'}
      aria-pressed={privacyMode}
    >
      {privacyMode ? (
        /* Closed eye icon */
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
          />
        </svg>
      ) : (
        /* Open eye icon */
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  );
}
