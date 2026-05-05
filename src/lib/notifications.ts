import { createClient } from '@/lib/supabase/client';
import type { NotificationType, Account } from '@/types';

/**
 * Creates a notification if one with the same deduplication key doesn't already exist.
 * Uses select-then-insert pattern since PostgREST upsert doesn't support partial unique indexes.
 */
export async function createNotificationIfNotExists(
  userId: string,
  type: NotificationType,
  message: string,
  deduplicationKey: string
): Promise<void> {
  const supabase = createClient();

  // Check if notification with this dedup key already exists
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('deduplication_key', deduplicationKey)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Insert new notification
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      message,
      deduplication_key: deduplicationKey,
      is_read: false,
    });

  if (error) {
    // Ignore duplicate key errors (race condition safety)
    if (error.code === '23505') return;
    console.error('Failed to create notification:', error);
  }
}

/**
 * Evaluates budget thresholds for a given category and month.
 * Creates budget alerts when spending crosses 75%, 90%, or 100% thresholds.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export async function evaluateBudgetThresholds(
  userId: string,
  categoryId: string,
  month: string
): Promise<void> {
  const supabase = createClient();

  // Fetch budgets for this category and month
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*, category:categories(name)')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('month', month);

  if (budgetError || !budgets || budgets.length === 0) return;

  // Calculate month range
  const monthStart = month;
  const monthDate = new Date(month);
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const monthEnd = nextMonth.toISOString().split('T')[0];

  // Fetch total spending for this category in this month
  const { data: expenses, error: expenseError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', monthStart)
    .lt('date', monthEnd);

  if (expenseError) return;

  const totalSpent = (expenses ?? []).reduce((sum, tx) => sum + tx.amount, 0);

  for (const budget of budgets) {
    const limit = budget.limit_amount;
    if (limit <= 0) continue;

    const ratio = totalSpent / limit;
    const categoryName = (budget.category as { name: string } | null)?.name ?? 'Kategori';

    const thresholds = [
      { pct: 100, check: ratio >= 1.0, msg: `Anggaran ${categoryName} telah terlampaui! Pengeluaran sudah mencapai ${Math.round(ratio * 100)}% dari batas.` },
      { pct: 90, check: ratio >= 0.9, msg: `Peringatan: Pengeluaran ${categoryName} sudah mencapai ${Math.round(ratio * 100)}% dari anggaran.` },
      { pct: 75, check: ratio >= 0.75, msg: `Pengeluaran ${categoryName} sudah mencapai ${Math.round(ratio * 100)}% dari anggaran.` },
    ];

    for (const t of thresholds) {
      if (t.check) {
        const dedupKey = `budget_alert:${budget.id}:${month}:${t.pct}`;
        await createNotificationIfNotExists(userId, 'budget_alert', t.msg, dedupKey);
      }
    }
  }
}

/**
 * Evaluates credit card due date reminders.
 * Creates reminders for 7 days, 3 days, and day-of due dates.
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function evaluateCreditCardReminders(
  userId: string,
  accounts: Account[]
): Promise<void> {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (const account of accounts) {
    if (account.type !== 'credit_card' || account.due_date == null) continue;

    const dueDay = account.due_date;

    // Calculate next due date
    let dueDate: Date;
    if (dueDay >= currentDay) {
      dueDate = new Date(currentYear, currentMonth, dueDay);
    } else {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    const diffTime = dueDate.getTime() - new Date(currentYear, currentMonth, currentDay).getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const billingMonth = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
    const dueDateStr = `${dueDay} ${dueDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

    const intervals = [
      { days: 7, msg: `Jatuh tempo kartu kredit ${account.name} dalam 7 hari (${dueDateStr}).` },
      { days: 3, msg: `Mendesak: Jatuh tempo kartu kredit ${account.name} dalam 3 hari (${dueDateStr}).` },
      { days: 0, msg: `Hari ini adalah jatuh tempo kartu kredit ${account.name} (${dueDateStr}).` },
    ];

    for (const interval of intervals) {
      if (diffDays === interval.days) {
        const dedupKey = `cc_reminder:${account.id}:${billingMonth}:${interval.days}`;
        await createNotificationIfNotExists(userId, 'cc_reminder', interval.msg, dedupKey);
      }
    }
  }
}

/**
 * Evaluates if a transaction amount exceeds the large transaction threshold.
 * Creates an alert if it does.
 * Requirements: 3.1
 */
export async function evaluateLargeTransaction(
  userId: string,
  amount: number,
  type: string,
  accountName: string,
  threshold: number
): Promise<void> {
  if (amount <= threshold) return;

  const typeLabel = type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer';
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const message = `Transaksi besar terdeteksi: ${typeLabel} ${formattedAmount} pada akun ${accountName}.`;

  // For large transactions, we use a timestamp-based key since each large tx is unique
  const dedupKey = `large_tx:${Date.now()}`;
  await createNotificationIfNotExists(userId, 'large_transaction', message, dedupKey);
}

/**
 * Evaluates commitment alerts for all accounts.
 * Creates a `commitment_alert` notification when Prediksi_Limit_Tagihan < 10% of official limit,
 * or when it goes negative.
 * Requirements: 8.1, 8.2, 8.3
 */
export async function evaluateCommitmentAlerts(
  userId: string,
  accounts: Account[],
  installments: import('@/types').Installment[],
  commitments: import('@/types').RecurringCommitment[]
): Promise<void> {
  const { calculateTotalMonthlyObligation, calculateProjectedEffectiveLimit } = await import('@/lib/limitCalculations');

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  for (const account of accounts) {
    const accountInstallments = installments.filter(
      (i) => i.account_id === account.id && i.status === 'active'
    );
    const accountCommitments = commitments.filter(
      (c) => c.account_id === account.id && c.is_active
    );

    const officialLimit =
      account.type === 'credit_card' ? account.credit_limit : account.commitment_limit;

    if (officialLimit == null || officialLimit <= 0) continue;

    const totalMonthly = calculateTotalMonthlyObligation(accountInstallments, accountCommitments);
    const projected = calculateProjectedEffectiveLimit(officialLimit, totalMonthly);

    const dedupKey = `commitment_alert:${account.id}:${dateStr}`;

    if (projected < 0) {
      const message = `Peringatan: Kewajiban bulanan akun ${account.name} telah melebihi limit (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(projected))} melebihi limit).`;
      await createNotificationIfNotExists(userId, 'commitment_alert', message, dedupKey);
    } else if (projected < officialLimit * 0.1) {
      const message = `Peringatan: Limit efektif akun ${account.name} hampir habis. Sisa prediksi: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(projected)}.`;
      await createNotificationIfNotExists(userId, 'commitment_alert', message, dedupKey);
    }
  }
}

/**
 * Evaluates payment due today notifications for all active installments.
 * Creates a `payment_due_today` notification when due_day == today's date.
 * Requirements: 8.4, 8.5, 8.6, 8.7
 */
export async function evaluatePaymentDueToday(
  userId: string,
  installments: import('@/types').Installment[],
  accountMap: Record<string, Account>,
  today: Date
): Promise<void> {
  const currentDay = today.getDate();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  for (const installment of installments) {
    if (installment.status !== 'active') continue;
    if (installment.due_day !== currentDay) continue;

    const account = accountMap[installment.account_id];
    const accountName = account?.name ?? 'akun';

    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(installment.monthly_amount);

    let message: string;
    if (installment.installment_type === 'cc') {
      message = `Hari ini limit ${accountName} akan terpotong sebesar ${formattedAmount} untuk cicilan ${installment.name}.`;
    } else {
      message = `Hari ini adalah hari pembayaran cicilan ${installment.name} sebesar ${formattedAmount} — jangan lupa bayar!`;
    }

    const dedupKey = `payment_due_today:${installment.id}:${dateStr}`;
    await createNotificationIfNotExists(userId, 'payment_due_today', message, dedupKey);
  }
}
