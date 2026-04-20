'use client';

import React from 'react';

export interface FABProps {
  onClick: () => void;
  'aria-label': string;
  children?: React.ReactNode;
}

export default function FAB({ onClick, 'aria-label': ariaLabel, children }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
      tabIndex={0}
    >
      {children ?? (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}
