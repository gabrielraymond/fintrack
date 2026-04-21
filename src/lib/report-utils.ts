/**
 * Pure aggregation and calculation functions for the Reports feature.
 * All functions are side-effect free and operate on existing Transaction/Category types.
 */

import type { Transaction, Category } from '@/types';

// ============================================================
// Report-specific Interfaces
// ============================================================

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrendData {
  month: string;       // "Jan", "Feb", etc.
  monthFull: string;   // "Januari 2024"
  income: number;
  expense: number;
}

export interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  percentageChange: number | null;
  isExpense: boolean;
}

export interface YearlySummaryData {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  monthlyData: MonthlyTrendData[];
}

export interface ComparisonIndicator {
  color: 'green' | 'red' | 'neutral';
  direction: 'up' | 'down' | 'none';
}

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
// Pie Chart Color Palette
// ============================================================

const CATEGORY_COLORS: readonly string[] = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#E11D48', '#84CC16', '#0EA5E9', '#D946EF', '#78716C',
];

// ============================================================
// Month Name Functions
// ============================================================

/**
 * Returns the short Indonesian month name for a 0-based month index.
 * e.g. 0 → "Jan", 7 → "Agu"
 */
export function getShortMonthName(monthIndex: number): string {
  return MONTH_NAMES_SHORT[monthIndex] ?? '';
}

/**
 * Returns the full Indonesian month name for a 0-based month index.
 * e.g. 0 → "Januari", 7 → "Agustus"
 */
export function getFullMonthName(monthIndex: number): string {
  return MONTH_NAMES_FULL[monthIndex] ?? '';
}

// ============================================================
// Category Colors
// ============================================================

/**
 * Returns an array of unique colors for pie chart segments.
 * Cycles through the palette if count exceeds available colors.
 */
export function getCategoryColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
  }
  return colors;
}

// ============================================================
// Period Navigation
// ============================================================

/**
 * Returns false if the given month/year is the current month or in the future.
 * Month is 0-based (0 = January).
 */
export function canNavigateNext(month: number, year: number): boolean {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (year > currentYear) return false;
  if (year === currentYear && month >= currentMonth) return false;
  return true;
}

/**
 * Returns the previous month/year, wrapping December → January across year boundaries.
 * Month is 0-based.
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Returns the next month/year, wrapping January → December across year boundaries.
 * Month is 0-based.
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

// ============================================================
// IDR Short Format
// ============================================================

/**
 * Formats an IDR amount into a short display string for chart axes.
 * 1500000 → "1,5jt", 500000 → "500rb", 800 → "800"
 */
export function formatIDRShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    const value = amount / 1_000_000_000;
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1).replace('.', ',');
    return `${formatted}M`;
  }
  if (amount >= 1_000_000) {
    const value = amount / 1_000_000;
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1).replace('.', ',');
    return `${formatted}jt`;
  }
  if (amount >= 1_000) {
    const value = amount / 1_000;
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1).replace('.', ',');
    return `${formatted}rb`;
  }
  return amount.toString();
}

// ============================================================
// Comparison Indicator
// ============================================================

/**
 * Determines the color and direction for a comparison indicator.
 * For expenses, positive change = red/up (unfavorable), negative = green/down (favorable).
 * For income/net, positive = green/up, negative = red/down.
 * Null percentage change → neutral/none.
 */
export function getComparisonIndicator(
  percentageChange: number | null,
  isExpense: boolean,
): ComparisonIndicator {
  if (percentageChange === null || percentageChange === 0) {
    return { color: 'neutral', direction: 'none' };
  }

  const isPositive = percentageChange > 0;

  if (isExpense) {
    return {
      color: isPositive ? 'red' : 'green',
      direction: isPositive ? 'up' : 'down',
    };
  }

  return {
    color: isPositive ? 'green' : 'red',
    direction: isPositive ? 'up' : 'down',
  };
}

// ============================================================
// Aggregation Functions
// ============================================================

/**
 * Calculates total income, total expenses, and net change from transactions.
 * Transfer-type transactions are excluded.
 */
export function calculateReportSummary(transactions: Transaction[]): ReportSummary {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpenses += t.amount;
    }
    // transfer is excluded
  }

  return {
    totalIncome,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
  };
}

/**
 * Groups expense transactions by category, calculates percentage, and sorts descending by amount.
 * Only expense-type transactions are included; transfers and income are excluded.
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  categories: Category[],
): CategoryExpense[] {
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  // Aggregate expense amounts per category
  const expenseMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category_id) continue;
    expenseMap.set(t.category_id, (expenseMap.get(t.category_id) ?? 0) + t.amount);
  }

  const totalExpenses = Array.from(expenseMap.values()).reduce((sum, a) => sum + a, 0);
  if (totalExpenses === 0) return [];

  const colors = getCategoryColors(expenseMap.size);
  let colorIndex = 0;

  const result: CategoryExpense[] = [];
  for (const [categoryId, amount] of Array.from(expenseMap.entries())) {
    const category = categoryMap.get(categoryId);
    result.push({
      categoryId,
      categoryName: category?.name ?? 'Lainnya',
      categoryIcon: category?.icon ?? '📦',
      amount,
      percentage: Math.round((amount / totalExpenses) * 100),
      color: colors[colorIndex++],
    });
  }

  // Sort descending by amount
  result.sort((a, b) => b.amount - a.amount);

  // Re-assign colors after sorting so the largest category gets the first color
  const sortedColors = getCategoryColors(result.length);
  for (let i = 0; i < result.length; i++) {
    result[i].color = sortedColors[i];
  }

  return result;
}

/**
 * Calculates percentage change between current and previous values.
 * Returns null when previous is 0 (cannot divide by zero).
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Groups transactions by month and calculates income/expense totals per month.
 * Returns entries for the last `months` months ending at the most recent transaction month.
 * Transfer-type transactions are excluded.
 *
 * @param transactions - all transactions in the date range (should cover `months` months)
 * @param months - number of months to include (6 for monthly view, 12 for yearly)
 * @param endMonth - 0-based month index of the last month in the range
 * @param endYear - year of the last month in the range
 */
export function calculateMonthlyTrend(
  transactions: Transaction[],
  months: number,
  endMonth: number,
  endYear: number,
): MonthlyTrendData[] {
  // Build the list of months we need
  const monthEntries: { m: number; y: number }[] = [];
  let m = endMonth;
  let y = endYear;
  for (let i = 0; i < months; i++) {
    monthEntries.unshift({ m, y });
    const prev = getPreviousMonth(m, y);
    m = prev.month;
    y = prev.year;
  }

  // Aggregate per month
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const entry of monthEntries) {
    monthlyMap.set(`${entry.y}-${entry.m}`, { income: 0, expense: 0 });
  }

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    if (t.type === 'income') {
      bucket.income += t.amount;
    } else if (t.type === 'expense') {
      bucket.expense += t.amount;
    }
  }

  return monthEntries.map(({ m: month, y: year }) => {
    const key = `${year}-${month}`;
    const data = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    return {
      month: getShortMonthName(month),
      monthFull: `${getFullMonthName(month)} ${year}`,
      income: data.income,
      expense: data.expense,
    };
  });
}

/**
 * Builds month-over-month comparison metrics for income, expenses, and net change.
 */
export function calculateMonthOverMonth(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
): ComparisonMetric[] {
  const current = calculateReportSummary(currentTransactions);
  const previous = calculateReportSummary(previousTransactions);

  return [
    {
      label: 'Pemasukan',
      currentValue: current.totalIncome,
      previousValue: previous.totalIncome,
      percentageChange: calculatePercentageChange(current.totalIncome, previous.totalIncome),
      isExpense: false,
    },
    {
      label: 'Pengeluaran',
      currentValue: current.totalExpenses,
      previousValue: previous.totalExpenses,
      percentageChange: calculatePercentageChange(current.totalExpenses, previous.totalExpenses),
      isExpense: true,
    },
    {
      label: 'Selisih Bersih',
      currentValue: current.netChange,
      previousValue: previous.netChange,
      percentageChange: calculatePercentageChange(current.netChange, previous.netChange),
      isExpense: false,
    },
  ];
}

/**
 * Calculates yearly summary including totals, averages, and 12 monthly entries.
 * Transfer-type transactions are excluded.
 */
export function calculateYearlySummary(
  transactions: Transaction[],
  year: number,
): YearlySummaryData {
  const monthlyData = calculateMonthlyTrend(transactions, 12, 11, year);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const entry of monthlyData) {
    totalIncome += entry.income;
    totalExpenses += entry.expense;
  }

  return {
    year,
    totalIncome,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
    avgMonthlyIncome: totalIncome / 12,
    avgMonthlyExpenses: totalExpenses / 12,
    monthlyData,
  };
}
