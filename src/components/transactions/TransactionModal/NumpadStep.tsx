'use client';

import React, { useState, useCallback } from 'react';
import { formatIDR } from '@/lib/formatters';

interface NumpadStepProps {
  initialAmount: number;
  onConfirm: (amount: number) => void;
}

const DIGIT_BUTTONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

export default function NumpadStep({ initialAmount, onConfirm }: NumpadStepProps) {
  const [digits, setDigits] = useState<string>(
    initialAmount > 0 ? String(initialAmount) : ''
  );
  const [error, setError] = useState<string | null>(null);

  const currentAmount = digits === '' ? 0 : parseInt(digits, 10);

  const handleDigit = useCallback((digit: string) => {
    setError(null);
    setDigits((prev) => {
      // Prevent leading zeros
      if (prev === '' && digit === '0') return prev;
      // Limit to reasonable length (15 digits)
      if (prev.length >= 15) return prev;
      return prev + digit;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setError(null);
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    if (currentAmount === 0) {
      setError('Jumlah tidak boleh nol');
      return;
    }
    onConfirm(currentAmount);
  }, [currentAmount, onConfirm]);

  return (
    <div className="space-y-4">
      {/* Amount display */}
      <div className="text-center py-4">
        <p className="text-caption text-text-muted mb-1">Jumlah</p>
        <p
          className="text-display text-text-primary"
          aria-live="polite"
          aria-label={`Jumlah: ${formatIDR(currentAmount)}`}
        >
          {formatIDR(currentAmount)}
        </p>
        {error && (
          <p className="text-caption text-danger mt-2" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Numpad">
        {DIGIT_BUTTONS.slice(0, 9).map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 rounded-lg bg-surface-secondary text-heading text-text-primary hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={digit}
          >
            {digit}
          </button>
        ))}
        {/* Bottom row: 0, backspace, confirm */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 rounded-lg bg-surface-secondary text-heading text-text-primary hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="0"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-14 rounded-lg bg-surface-secondary text-heading text-text-primary hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Hapus digit terakhir"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="h-14 rounded-lg bg-primary text-primary-foreground text-heading hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Konfirmasi jumlah"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
