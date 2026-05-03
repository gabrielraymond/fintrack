import { getCycleRange, getCycleBudgetMonth, type CycleRange } from './cycle-utils';

// ============================================================
// Indonesian Month Names
// ============================================================

const MONTH_NAMES_FULL: readonly string[] = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_NAMES_SHORT: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// ============================================================
// Period Navigation
// ============================================================

/**
 * Returns false if the given month/year is the current month or in the future.
 * Month is 0-based (0 = January).
 */
/**
 * Returns false if the given month/year is the current budget period or in the future.
 * Month is 0-based (0 = January).
 * Uses cutoffDate to determine the current budget period correctly.
 */
export function canNavigateCashFlowNext(month: number, year: number, cutoffDate: number = 1): boolean {
  // Determine the current budget month based on cutoff date
  const cycleRange = getCycleRange(cutoffDate);
  const currentBudgetMonth = getCycleBudgetMonth(cycleRange); // "YYYY-MM-01"
  const currentBudgetMonthIdx = parseInt(currentBudgetMonth.slice(5, 7), 10) - 1; // 0-indexed
  const currentBudgetYear = parseInt(currentBudgetMonth.slice(0, 4), 10);

  if (year > currentBudgetYear) return false;
  if (year === currentBudgetYear && month >= currentBudgetMonthIdx) return false;
  return true;
}

/**
 * Returns the previous month/year, wrapping December → January across year boundaries.
 * Month is 0-based.
 */
export function getPreviousCashFlowPeriod(month: number, year: number): { month: number; year: number } {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Returns the next month/year, wrapping January → December across year boundaries.
 * Month is 0-based.
 */
export function getNextCashFlowPeriod(month: number, year: number): { month: number; year: number } {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

// ============================================================
// Period Label Formatting
// ============================================================

/**
 * Generates a human-readable period label for the CashFlowPeriodSelector.
 *
 * - If cutoffDate = 1: returns full month name + year (e.g., "Januari 2024")
 * - If cutoffDate > 1: returns date range (e.g., "25 Jan – 24 Feb")
 *
 * @param cycleRange - The cycle range with start/end dates in "YYYY-MM-DD" format
 * @param cutoffDate - Integer 1-28 representing the user's cutoff date
 */
export function formatCashFlowPeriodLabel(cycleRange: CycleRange, cutoffDate: number): string {
  if (cutoffDate === 1) {
    // Standard calendar month: show full month name + year
    const [yearStr, monthStr] = cycleRange.start.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1; // convert to 0-based
    return `${MONTH_NAMES_FULL[monthIndex]} ${yearStr}`;
  }

  // Cutoff > 1: show date range "DD Mon – DD Mon"
  const startDate = new Date(cycleRange.start + 'T00:00:00');
  const endDate = new Date(cycleRange.end + 'T00:00:00');

  // End label is end date minus 1 day (cycle end is exclusive)
  endDate.setDate(endDate.getDate() - 1);

  const startDay = startDate.getDate();
  const startMonthShort = MONTH_NAMES_SHORT[startDate.getMonth()];
  const endDay = endDate.getDate();
  const endMonthShort = MONTH_NAMES_SHORT[endDate.getMonth()];

  return `${startDay} ${startMonthShort} – ${endDay} ${endMonthShort}`;
}
