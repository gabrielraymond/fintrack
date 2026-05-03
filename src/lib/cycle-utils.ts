export interface CycleRange {
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD"
}

/**
 * Menghitung rentang siklus anggaran berdasarkan cutoff date.
 *
 * Logika:
 * - Jika cutoffDate === 1: siklus = 1 bulan berjalan s/d 1 bulan berikutnya (bulan kalender standar)
 * - Jika cutoffDate > 1 dan referenceDate >= cutoffDate bulan berjalan:
 *     siklus = cutoffDate bulan berjalan s/d cutoffDate bulan berikutnya
 * - Jika cutoffDate > 1 dan referenceDate < cutoffDate bulan berjalan:
 *     siklus = cutoffDate bulan sebelumnya s/d cutoffDate bulan berjalan
 *
 * @param cutoffDate - Integer 1-28
 * @param referenceDate - Tanggal acuan (default: hari ini)
 * @returns CycleRange { start, end } dalam format "YYYY-MM-DD"
 */
export function getCycleRange(
  cutoffDate: number,
  referenceDate: Date = new Date()
): CycleRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-11
  const day = referenceDate.getDate();

  if (cutoffDate === 1) {
    const start = formatDate(year, month, 1);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const end = formatDate(nextYear, nextMonth, 1);
    return { start, end };
  }

  if (day >= cutoffDate) {
    // Siklus dimulai di bulan berjalan
    const start = formatDate(year, month, cutoffDate);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const end = formatDate(nextYear, nextMonth, cutoffDate);
    return { start, end };
  } else {
    // Siklus dimulai di bulan sebelumnya
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const start = formatDate(prevYear, prevMonth, cutoffDate);
    const end = formatDate(year, month, cutoffDate);
    return { start, end };
  }
}

/**
 * Menentukan bulan anggaran (budget month) berdasarkan cycle range.
 * Budget month = tanggal 1 dari bulan di mana siklus dimulai.
 * Contoh: cycle start "2024-01-25" → budget month "2024-01-01"
 */
export function getCycleBudgetMonth(cycleRange: CycleRange): string {
  const [year, month] = cycleRange.start.split('-');
  return `${year}-${month}-01`;
}

/**
 * Menghitung cycle range untuk bulan anggaran tertentu.
 * Kebalikan dari getCycleBudgetMonth — dari budget month ke cycle range.
 *
 * @param budgetMonth - Format "YYYY-MM-01" atau "YYYY-MM"
 * @param cutoffDate - Integer 1-28
 */
export function getCycleRangeForMonth(
  budgetMonth: string,
  cutoffDate: number
): CycleRange {
  const parts = budgetMonth.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed

  if (cutoffDate === 1) {
    const start = formatDate(year, month, 1);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const end = formatDate(nextYear, nextMonth, 1);
    return { start, end };
  }

  const start = formatDate(year, month, cutoffDate);
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const end = formatDate(nextYear, nextMonth, cutoffDate);
  return { start, end };
}

/**
 * Menghitung budget month sebelumnya.
 * Input: "2024-03-01" → Output: "2024-02-01"
 * Input: "2024-01-01" → Output: "2023-12-01"
 */
export function getPreviousMonth(budgetMonth: string): string {
  const parts = budgetMonth.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-indexed

  if (month === 1) {
    return `${year - 1}-12-01`;
  }

  return `${year}-${String(month - 1).padStart(2, '0')}-01`;
}

/** Format tanggal ke "YYYY-MM-DD" dari komponen year, month (0-indexed), day. */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
