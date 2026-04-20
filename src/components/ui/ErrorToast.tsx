'use client';

import React, { useEffect, useState } from 'react';

export interface ErrorToastProps {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function ErrorToast({
  message,
  onRetry,
  onDismiss,
  autoDismissMs = 5000,
}: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-3 bg-danger text-danger-foreground rounded-lg px-4 py-3 shadow-lg"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="flex-1 text-caption">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3 py-1 text-caption font-medium bg-white/20 rounded-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Coba lagi"
        >
          Coba Lagi
        </button>
      )}
      <button
        onClick={() => {
          setVisible(false);
          onDismiss();
        }}
        className="flex-shrink-0 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Tutup notifikasi"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
