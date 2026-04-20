'use client';

import React, { useState } from 'react';
import { isValidTransactionDate } from '@/lib/validators';

interface DetailsStepProps {
  initialNote: string;
  initialDate: Date;
  isSubmitting: boolean;
  onConfirm: (note: string, date: Date) => void;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMinDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return toDateInputValue(d);
}

function getMaxDate(): string {
  return toDateInputValue(new Date());
}

export default function DetailsStep({
  initialNote,
  initialDate,
  isSubmitting,
  onConfirm,
}: DetailsStepProps) {
  const [note, setNote] = useState(initialNote);
  const [dateStr, setDateStr] = useState(toDateInputValue(initialDate));
  const [dateError, setDateError] = useState<string | null>(null);

  const handleConfirm = () => {
    const date = new Date(dateStr + 'T00:00:00');
    const validation = isValidTransactionDate(date);
    if (!validation.valid) {
      setDateError(validation.message ?? 'Tanggal tidak valid');
      return;
    }
    setDateError(null);
    onConfirm(note, date);
  };

  const handleDateChange = (value: string) => {
    setDateStr(value);
    const date = new Date(value + 'T00:00:00');
    const validation = isValidTransactionDate(date);
    if (!validation.valid) {
      setDateError(validation.message ?? 'Tanggal tidak valid');
    } else {
      setDateError(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Note input */}
      <div>
        <label htmlFor="transaction-note" className="block text-body text-text-secondary mb-1">
          Catatan (opsional)
        </label>
        <input
          id="transaction-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan..."
          maxLength={200}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          aria-label="Catatan transaksi"
        />
      </div>

      {/* Date picker */}
      <div>
        <label htmlFor="transaction-date" className="block text-body text-text-secondary mb-1">
          Tanggal
        </label>
        <input
          id="transaction-date"
          type="date"
          value={dateStr}
          min={getMinDate()}
          max={getMaxDate()}
          onChange={(e) => handleDateChange(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary ${
            dateError ? 'border-danger' : 'border-border focus:border-primary'
          }`}
          aria-label="Tanggal transaksi"
          aria-invalid={!!dateError}
          aria-describedby={dateError ? 'date-error' : undefined}
        />
        {dateError && (
          <p id="date-error" className="text-caption text-danger mt-1" role="alert">
            {dateError}
          </p>
        )}
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting || !!dateError}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-body font-medium hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Simpan transaksi"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  );
}
