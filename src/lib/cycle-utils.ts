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
 *
 * Logika: label bulan = bulan dimana mayoritas hari dalam siklus jatuh.
 * - Jika cutoff > 15: mayoritas hari ada di bulan berikutnya dari start,
 *   jadi budget month = bulan berikutnya.
 * - Jika cutoff <= 15: mayoritas hari ada di bulan yang sama dengan start,
 *   jadi budget month = bulan start.
 *
 * Karena kita tidak menerima cutoffDate sebagai parameter, kita tentukan
 * dari tanggal start: jika day-of-month start > 15, maka bulan berikutnya.
 *
 * Contoh:
 * - cycle start "2025-04-25" → budget month "2025-05-01" (Mei)
 * - cycle start "2025-05-10" → budget month "2025-05-01" (Mei)
 * - cycle start "2025-05-01" → budget month "2025-05-01" (Mei)
 */
export function getCycleBudgetMonth(cycleRange: CycleRange): string {
  const [yearStr, monthStr, dayStr] = cycleRange.start.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed
  const day = parseInt(dayStr, 10);

  if (day > 15) {
    // Majority of days fall in the next month
    if (month === 12) {
      return `${year + 1}-01-01`;
    }
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }

  return `${yearStr}-${monthStr}-01`;
}

/**
 * Menghitung cycle range untuk bulan anggaran tertentu.
 * Kebalikan dari getCycleBudgetMonth — dari budget month ke cycle range.
 *
 * Logika:
 * - Jika cutoff <= 15: start = cutoffDate di bulan yang sama dengan budgetMonth
 * - Jika cutoff > 15: start = cutoffDate di bulan SEBELUMNYA dari budgetMonth
 *   (karena getCycleBudgetMonth menggeser label ke bulan berikutnya)
 * - Jika cutoff === 1: start = tanggal 1 bulan budgetMonth (standar)
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

  if (cutoffDate > 15) {
    // Budget month is the month AFTER start, so start is in previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const start = formatDate(prevYear, prevMonth, cutoffDate);
    const end = formatDate(year, month, cutoffDate);
    return { start, end };
  }

  // cutoff <= 15: start is in the same month as budgetMonth
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
