'use client';

import React from 'react';
import Button from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" role="alert">
      <svg
        className="w-16 h-16 text-danger mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-body text-text-secondary mb-4">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
