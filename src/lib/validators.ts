/**
 * Validation utilities for FinTrack.
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates that a transaction date falls within the allowed range:
 * [today - 1 year, today (end of day)].
 *
 * @param date - the date to validate
 * @returns validation result with optional Bahasa Indonesia error message
 */
export function isValidTransactionDate(date: Date): ValidationResult {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  if (date > today) {
    return { valid: false, message: 'Tanggal tidak boleh di masa depan' };
  }

  if (date < oneYearAgo) {
    return { valid: false, message: 'Tanggal tidak boleh lebih dari 1 tahun lalu' };
  }

  return { valid: true };
}
