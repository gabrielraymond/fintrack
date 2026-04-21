# Tasks

## Task 1: Database Schema Migration

- [x] 1.1 Create migration file `supabase/migrations/00006_enhancements.sql` with:
  - [x] 1.1.1 Create `notifications` table with columns: id (UUID PK), user_id (FK auth.users), type (CHECK 'budget_alert','cc_reminder','large_transaction'), message (TEXT), is_read (BOOLEAN DEFAULT false), deduplication_key (TEXT), created_at (TIMESTAMPTZ DEFAULT now())
  - [x] 1.1.2 Create unique partial index `idx_notifications_dedup` on (user_id, deduplication_key) WHERE deduplication_key IS NOT NULL
  - [x] 1.1.3 Create index `idx_notifications_user_unread` on (user_id, is_read, created_at DESC)
  - [x] 1.1.4 Enable RLS on notifications table and create policy "Users can only access own notifications" for ALL using (auth.uid() = user_id)
  - [x] 1.1.5 ALTER accounts table: drop existing type CHECK constraint, add new CHECK constraint including 'tabungan' and 'dana_darurat', add column `target_amount BIGINT`
  - [x] 1.1.6 ALTER user_profiles table: add column `theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light','dark','system'))`, add column `large_transaction_threshold BIGINT NOT NULL DEFAULT 1000000`

## Task 2: TypeScript Type Updates

- [x] 2.1 Update `src/types/index.ts`:
  - [x] 2.1.1 Add 'tabungan' and 'dana_darurat' to `AccountType` union
  - [x] 2.1.2 Add `target_amount: number | null` to `Account` interface
  - [x] 2.1.3 Add `NotificationType` type: 'budget_alert' | 'cc_reminder' | 'large_transaction'
  - [x] 2.1.4 Add `Notification` interface with id, user_id, type, message, is_read, deduplication_key, created_at
  - [x] 2.1.5 Add `theme_preference: 'light' | 'dark' | 'system'` and `large_transaction_threshold: number` to `UserProfile` interface
  - [x] 2.1.6 Add `target_amount?: number` to `AccountFormInput` interface

## Task 3: Theme System (Dark/Light Mode)

- [x] 3.1 Update `src/app/globals.css`: convert all hardcoded color values in `:root` to CSS variables and add `html.dark` block with dark theme variable overrides (dark background #0F172A, dark surface #1E293B, light text #F1F5F9, etc.)
- [x] 3.2 Update `tailwind.config.ts`: change hardcoded color values to reference CSS variables using `var(--variable-name)` so all existing Tailwind classes automatically respond to theme changes
- [x] 3.3 Create `src/providers/ThemeProvider.tsx`: ThemeProvider context that reads from localStorage('fintrack-theme'), defaults to 'system', resolves via matchMedia('prefers-color-scheme: dark'), sets/removes 'dark' class on `<html>`, syncs to user_profiles in background. Export `useTheme` hook returning { theme, resolvedTheme, setTheme }
- [x] 3.4 Create `src/components/ui/ThemeToggle.tsx`: three-state toggle component (light/dark/system) with sun/moon/monitor icons. Accept `compact` prop for icon-only mode in Sidebar/BottomNav
- [x] 3.5 Update `src/app/layout.tsx`: wrap children with ThemeProvider (between ToastProvider and children). Add inline script in `<head>` to read localStorage and set 'dark' class before hydration to prevent flash
- [x] 3.6 Add ThemeToggle to `src/components/layout/Sidebar.tsx` (above logout button) and to `src/app/(protected)/settings/page.tsx` (new ThemeSection)
- [x] 3.7 Update `src/lib/constants.ts`: add 'tabungan' and 'dana_darurat' entries to ACCOUNT_TYPES array with labels "Tabungan" and "Dana Darurat"

## Task 4: Privacy Mode

- [x] 4.1 Create `src/providers/PrivacyProvider.tsx`: PrivacyProvider context with privacyMode boolean state backed by sessionStorage('fintrack-privacy'). Export `usePrivacy` hook returning { privacyMode, togglePrivacy }
- [x] 4.2 Create `src/hooks/useFormatIDR.ts`: hook that returns a formatting function — when privacyMode is true returns 'Rp •••••••', otherwise delegates to formatIDR
- [x] 4.3 Create `src/components/ui/PrivacyToggle.tsx`: eye icon button (open eye when off, closed eye when on) that calls togglePrivacy on click
- [x] 4.4 Update `src/app/layout.tsx`: wrap children with PrivacyProvider (innermost provider, after ThemeProvider)
- [x] 4.5 Update all components that call `formatIDR` directly to use `useFormatIDR()` hook instead:
  - [x] 4.5.1 `src/components/dashboard/AccountSummaryStrip.tsx`
  - [x] 4.5.2 `src/components/dashboard/NetWorthCard.tsx`
  - [x] 4.5.3 `src/components/dashboard/MonthlySummaryCard.tsx`
  - [x] 4.5.4 `src/components/dashboard/CashFlowChart.tsx`
  - [x] 4.5.5 `src/components/dashboard/BudgetProgressSection.tsx`
  - [x] 4.5.6 `src/components/dashboard/RecentTransactions.tsx`
  - [x] 4.5.7 `src/components/accounts/AccountCard.tsx`
  - [x] 4.5.8 `src/components/accounts/CreditCardProgress.tsx`
  - [x] 4.5.9 `src/components/budgets/BudgetCard.tsx`
  - [x] 4.5.10 `src/components/transactions/TransactionList.tsx`
  - [x] 4.5.11 `src/app/(protected)/settings/page.tsx` (PresetSection formatIDR usage)
  - [x] 4.5.12 `src/components/reports/ReportSummaryCard.tsx`
  - [x] 4.5.13 `src/components/reports/CategoryBreakdown.tsx`
  - [x] 4.5.14 `src/components/reports/ExpensePieChart.tsx`
  - [x] 4.5.15 `src/components/reports/IncomeExpenseTrendChart.tsx`
  - [x] 4.5.16 `src/components/reports/MonthOverMonthComparison.tsx`
  - [x] 4.5.17 `src/components/reports/YearlySummaryView.tsx`
- [x] 4.6 Update `src/providers/AuthProvider.tsx`: in signOut callback, clear sessionStorage('fintrack-privacy') to reset privacy mode on logout

## Task 5: Notification System

- [x] 5.1 Create `src/hooks/useNotifications.ts`: Tanstack Query hooks for notifications — `useUnreadCount` (polls every 60s), `useNotifications` (fetches all, ordered by created_at DESC), `useMarkNotificationRead` (mutation), `useMarkAllNotificationsRead` (mutation). Include query key factory.
- [x] 5.2 Create `src/lib/notifications.ts`: helper functions — `createNotificationIfNotExists(userId, type, message, deduplicationKey)` using upsert with deduplication_key, `evaluateBudgetThresholds(userId, categoryId, month)` that checks spending vs budget and creates alerts for crossed thresholds, `evaluateCreditCardReminders(userId, accounts)` that checks due dates and creates reminders, `evaluateLargeTransaction(userId, amount, type, accountName, threshold)` that creates alert if amount > threshold
- [x] 5.3 Create `src/components/layout/NotificationBell.tsx`: bell icon button with badge count overlay. Uses `useUnreadCount` hook. On click, toggles NotificationPanel open/closed.
- [x] 5.4 Create `src/components/notifications/NotificationPanel.tsx`: dropdown panel listing notifications with type icon (🔔 budget, 💳 cc, ⚠️ large tx), message text, relative time (using Intl.RelativeTimeFormat). Includes "Tandai semua dibaca" button. Each notification clickable to mark as read.
- [x] 5.5 Update `src/hooks/useTransactions.ts`: in `useCreateTransaction` and `useUpdateTransaction` onSuccess callbacks, call `evaluateBudgetThresholds` and `evaluateLargeTransaction` to generate notifications after successful transaction operations
- [x] 5.6 Integrate notification evaluation into app initialization: in `useNotifications` hook, on first load call `evaluateCreditCardReminders` for all credit card accounts with due_dates

## Task 6: Savings & Emergency Fund Accounts

- [x] 6.1 Update `src/components/accounts/AccountForm.tsx`: show `target_amount` input field when type is 'tabungan' or 'dana_darurat'. Include target_amount in onSubmit data.
- [x] 6.2 Update `src/hooks/useAccounts.ts`: include `target_amount` in `useCreateAccount` mutation insert payload
- [x] 6.3 Create `src/components/accounts/SavingsProgressBar.tsx`: progress bar component showing percentage (balance/target×100%), green when ≥100%, primary color otherwise. Display remaining amount text.
- [x] 6.4 Update `src/components/accounts/AccountCard.tsx`: render SavingsProgressBar when account type is 'tabungan' or 'dana_darurat' and target_amount is set
- [x] 6.5 Update `src/app/(protected)/accounts/page.tsx`: split accounts into two sections — regular accounts and "Tabungan & Dana Darurat" section for tabungan/dana_darurat types
- [x] 6.6 Create `src/components/dashboard/SavingsProgressSection.tsx`: dashboard section showing all savings/emergency accounts with targets. Display name, balance, target, progress bar. Hidden when no accounts have targets.
- [x] 6.7 Update `src/app/(protected)/dashboard/page.tsx`: add SavingsProgressSection between BudgetProgressSection and RecentTransactions

## Task 7: Layout Integration

- [x] 7.1 Update `src/app/(protected)/layout.tsx`: add a header bar in the protected layout containing PrivacyToggle and NotificationBell, positioned at top-right
- [x] 7.2 Update `src/components/layout/Sidebar.tsx`: add NotificationBell near the top (after FinTrack title) and ThemeToggle (compact mode) above the logout button
- [x] 7.3 Update `src/app/(protected)/settings/page.tsx`: add ThemeSection (theme toggle with three options) and NotificationSettingsSection (large_transaction_threshold input) to settings page

## Task 8: Property-Based Tests

- [x] 8.1 Install `fast-check` as dev dependency
- [x] 8.2 Create `src/__tests__/properties/budget-threshold-alert.property.test.ts`: PBT for Property 1 — generate random budget limits and expense sequences, verify alerts created at correct thresholds with correct messages
- [x] 8.3 Create `src/__tests__/properties/notification-deduplication.property.test.ts`: PBT for Property 2 — generate random notification creation attempts with same deduplication keys, verify at most one notification per key
- [x] 8.4 Create `src/__tests__/properties/cc-reminder-interval.property.test.ts`: PBT for Property 3 — generate random due_dates and current dates, verify reminders created iff days match intervals (7, 3, 0)
- [x] 8.5 Create `src/__tests__/properties/large-transaction-alert.property.test.ts`: PBT for Property 4 — generate random amounts and thresholds, verify alert created iff amount > threshold
- [x] 8.6 Create `src/__tests__/properties/badge-count.property.test.ts`: PBT for Property 5 — generate random notification sets with random is_read values, verify badge count equals unread count
- [x] 8.7 Create `src/__tests__/properties/notification-ordering.property.test.ts`: PBT for Property 6 — generate random notifications with random timestamps, verify displayed order is descending by created_at
- [x] 8.8 Create `src/__tests__/properties/savings-progress.property.test.ts`: PBT for Property 9 — generate random balance and target_amount, verify progress percentage and remaining amount calculations
- [x] 8.9 Create `src/__tests__/properties/privacy-masking.property.test.ts`: PBT for Property 10 — generate random amounts, verify useFormatIDR returns 'Rp •••••••' when privacy mode is on
- [x] 8.10 Create `src/__tests__/properties/privacy-toggle-roundtrip.property.test.ts`: PBT for Property 11 — generate random initial states, verify double toggle returns to original state
- [x] 8.11 Create `src/__tests__/properties/theme-resolution.property.test.ts`: PBT for Property 8 — generate random system preferences, verify resolvedTheme matches when theme is 'system'

## Task 9: Unit Tests

- [x] 9.1 Create `src/components/ui/__tests__/ThemeToggle.test.tsx`: test three options render, click changes theme
- [x] 9.2 Create `src/components/ui/__tests__/PrivacyToggle.test.tsx`: test icon changes on toggle, privacy mode activates
- [x] 9.3 Create `src/components/notifications/__tests__/NotificationPanel.test.tsx`: test notification list rendering, mark as read, mark all read
- [x] 9.4 Create `src/components/accounts/__tests__/SavingsProgressBar.test.tsx`: test progress bar renders correctly, shows "tercapai" at 100%
- [x] 9.5 Create `src/components/dashboard/__tests__/SavingsProgressSection.test.tsx`: test section renders with savings accounts, hidden when none have targets
- [x] 9.6 Update `src/components/accounts/__tests__/AccountForm.test.tsx`: test target_amount field appears for tabungan/dana_darurat types
