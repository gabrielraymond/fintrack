/**
 * Formatting utilities for IDR currency and Bahasa Indonesia dates.
 */

/**
 * Formats an integer amount (in smallest IDR unit) to Indonesian Rupiah display string.
 * e.g. 1500000 → "Rp 1.500.000"
 * Negative values: "-Rp 500.000"
 *
 * @param amountInSmallestUnit - integer amount in IDR
 * @returns formatted IDR string
 */
export function formatIDR(amountInSmallestUnit: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInSmallestUnit);
}

/**
 * Formats a Date (or ISO date string) for display in Bahasa Indonesia.
 * e.g. 2024-03-15 → "15 Maret 2024"
 *
 * @param date - Date object or ISO date string
 * @returns formatted date string in Bahasa Indonesia
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
