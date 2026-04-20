# Design Document

## Overview

FinTrack is a personal finance web application for Indonesian users, built with Next.js 14 (App Router) and Supabase. It provides multi-account tracking, transaction management, budgeting, and dashboard analytics — all in IDR currency with Bahasa Indonesia as the default language. The design prioritizes a mobile-first responsive experience with offline resilience, accessibility, and performance for large datasets.

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Tanstack Query (for server state caching, pagination, optimistic updates)
- **Charts**: Recharts
- **Backend/Database**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel

### Application Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth group (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/              # Authenticated routes
│   │   ├── layout.tsx            # Shell with nav (Bottom_Nav / Sidebar)
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── settings/page.tsx
│   │   └── onboarding/page.tsx
│   ├── layout.tsx                # Root layout (providers)
│   └── page.tsx                  # Redirect to dashboard or login
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── ErrorToast.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── EmptyState.tsx
│   │   └── FAB.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── ResponsiveShell.tsx
│   ├── dashboard/
│   │   ├── NetWorthCard.tsx
│   │   ├── AccountSummaryStrip.tsx
│   │   ├── MonthlySummaryCard.tsx
│   │   ├── CashFlowChart.tsx
│   │   ├── BudgetProgressSection.tsx
│   │   └── RecentTransactions.tsx
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionFilters.tsx
│   │   ├── TransactionSearch.tsx
│   │   ├── TransactionModal/
│   │   │   ├── index.tsx
│   │   │   ├── TypeStep.tsx
│   │   │   ├── CategoryStep.tsx
│   │   │   ├── NumpadStep.tsx
│   │   │   ├── AccountStep.tsx
│   │   │   └── DetailsStep.tsx
│   │   └── TransactionPresetChips.tsx
│   ├── accounts/
│   │   ├── AccountCard.tsx
│   │   ├── AccountForm.tsx
│   │   ├── CreditCardProgress.tsx
│   │   └── SoftDeletedAccounts.tsx
│   └── budgets/
│       ├── BudgetCard.tsx
│       ├── BudgetForm.tsx
│       └── BudgetProgressBar.tsx
├── hooks/
│   ├── useAccounts.ts
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   ├── useCategories.ts
│   ├── usePresets.ts
│   ├── useNetWorth.ts
│   ├── useAuth.ts
│   └── useInfiniteScroll.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware for session refresh
│   ├── formatters.ts             # IDR formatting, date formatting
│   ├── validators.ts             # Date validation, amount validation
│   ├── csv-export.ts             # CSV generation and download
│   └── constants.ts              # Default categories, account types
├── types/
│   └── index.ts                  # TypeScript interfaces
└── providers/
    ├── AuthProvider.tsx
    ├── QueryProvider.tsx
    └── ToastProvider.tsx
```

## Database Schema

### Tables

```sql
-- Users are managed by Supabase Auth (auth.users)

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'e-wallet', 'cash', 'credit_card', 'investment')),
  balance BIGINT NOT NULL DEFAULT 0,          -- stored in smallest IDR unit
  credit_limit BIGINT,                         -- only for credit_card type
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31), -- day of month, credit_card only
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  destination_account_id UUID REFERENCES accounts(id),  -- for transfers
  category_id UUID REFERENCES categories(id),            -- null for transfers
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  month DATE NOT NULL,                                    -- first day of month
  limit_amount BIGINT NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month)
);

CREATE TABLE transaction_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  destination_account_id UUID REFERENCES accounts(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security

All tables enforce RLS with policies:
```sql
-- Example for accounts table (same pattern for all tables)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Indexes

```sql
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_id);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX idx_accounts_user_deleted ON accounts(user_id, is_deleted);
```

## Component Design

### Authentication Flow

1. `middleware.ts` intercepts all requests, refreshes Supabase session tokens silently
2. Unauthenticated users accessing `(protected)` routes are redirected to `/login`
3. On session refresh failure, redirect to `/login` with `?expired=true&redirect={currentPath}`
4. After login, redirect to the `redirect` query param if present, otherwise to `/dashboard`

### Transaction Modal (5-Step Flow)

State machine with steps: `type` → `category` → `numpad` → `account` → `details`

```typescript
type TransactionModalState = {
  step: 'type' | 'category' | 'numpad' | 'account' | 'details';
  type: 'income' | 'expense' | 'transfer' | null;
  categoryId: string | null;
  amount: number;           // in smallest IDR unit
  accountId: string | null;
  destinationAccountId: string | null;  // for transfers
  note: string;
  date: Date;
};
```

- Transfer type skips the category step
- Numpad builds amount as string of digits, converts to number on confirm
- Date defaults to today, constrained to [today - 1 year, today]
- Focus trap enabled while modal is open

### Balance Update Logic

All balance updates happen via Supabase database functions (RPC) to ensure atomicity:

```typescript
// Pseudocode for transaction creation
async function createTransaction(tx: NewTransaction) {
  // Single RPC call that:
  // 1. Inserts the transaction row
  // 2. Updates account balance(s) atomically
  // For expense: account.balance -= amount
  // For income: account.balance += amount
  // For transfer: source.balance -= amount, dest.balance += amount
  return supabase.rpc('create_transaction', { ...tx });
}
```

Edit and delete operations similarly use RPC to reverse old effects and apply new ones atomically.

### IDR Formatting

```typescript
function formatIDR(amountInSmallestUnit: number): string {
  // Convert to display value, format with Rp prefix
  // Use period as thousands separator, comma as decimal
  // e.g., 1500000 → "Rp 1.500.000"
  // Negative values: "- Rp 500.000" (red text via CSS)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amountInSmallestUnit);
}
```

### Date Validation

```typescript
function isValidTransactionDate(date: Date): { valid: boolean; message?: string } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  if (date > today) return { valid: false, message: 'Tanggal tidak boleh di masa depan' };
  if (date < oneYearAgo) return { valid: false, message: 'Tanggal tidak boleh lebih dari 1 tahun lalu' };
  return { valid: true };
}
```

### Infinite Scroll / Pagination

Transactions use cursor-based pagination via Tanstack Query's `useInfiniteQuery`:

```typescript
function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }) => fetchTransactions({ ...filters, cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

An `IntersectionObserver` triggers `fetchNextPage` when the sentinel element enters the viewport.

### Search Implementation

Client-side filtering combined with server-side search for large datasets:

```typescript
// Supabase query with text search
const { data } = await supabase
  .from('transactions')
  .select('*, category:categories(name)')
  .or(`note.ilike.%${searchText}%,category.name.ilike.%${searchText}%`)
  .order('date', { ascending: false })
  .range(offset, offset + limit - 1);
```

### Error Resilience

```typescript
// Tanstack Query mutation with retry and error toast
const mutation = useMutation({
  mutationFn: createTransaction,
  retry: 1,
  onError: (error) => {
    toast.error({
      message: 'Gagal menyimpan transaksi',
      action: { label: 'Coba Lagi', onClick: () => mutation.mutate(mutation.variables) },
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  },
});
```

### Confirmation Dialog

Reusable component used for all destructive actions:

```typescript
type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  requireTypedConfirmation?: string;  // For danger zone
  onConfirm: () => void;
  onCancel: () => void;
};
```

### Budget Duplicate Prevention

When creating a budget, the form queries existing budgets for the selected month and disables categories that already have a budget. If the DB unique constraint is hit (race condition), the error is caught and displayed as a user-friendly message.

### Account Reactivation

The Accounts page includes a toggle/tab to show soft-deleted accounts. Each soft-deleted account card shows a "Restore" button. Reactivation sets `is_deleted = false` and triggers Net_Worth recalculation.

### Responsive Navigation

```typescript
// ResponsiveShell.tsx
function ResponsiveShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:flex" />       {/* >= 768px */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav className="md:hidden" />           {/* < 768px */}
    </div>
  );
}
```

### Accessibility

- All interactive elements receive `tabIndex`, `role`, and `aria-label` attributes as needed
- Modal and dropdown components implement focus trap (focus cycles within while open)
- Keyboard handlers: `Escape` closes modals, `Enter`/`Space` activates buttons
- Color contrast minimum 4.5:1 enforced via Tailwind CSS design tokens
- Semantic HTML: `<nav>`, `<main>`, `<button>`, `<dialog>`, `<form>` used appropriately

### CSV Export

```typescript
function exportTransactionsCSV(transactions: Transaction[], categories: Category[], accounts: Account[]) {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Akun', 'Catatan'];
  const rows = transactions.map(tx => [
    formatDate(tx.date),
    tx.type,
    categories.find(c => c.id === tx.category_id)?.name ?? '-',
    tx.amount.toString(),
    accounts.find(a => a.id === tx.account_id)?.name ?? '-',
    tx.note ?? '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadBlob(csv, 'fintrack-transaksi.csv', 'text/csv');
}
```

### Net Worth Calculation

```typescript
function calculateNetWorth(accounts: Account[]): number {
  return accounts
    .filter(a => !a.is_deleted)
    .reduce((sum, account) => {
      // Credit card balances represent debt, so they're subtracted
      // All other account types are added
      return sum + account.balance;
      // Note: credit card balance is stored as negative already
    }, 0);
}
```

### Budget Progress Calculation

```typescript
function getBudgetStatus(spent: number, limit: number): 'green' | 'yellow' | 'red' {
  const ratio = spent / limit;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.75) return 'yellow';
  return 'green';
}
```

## Correctness Properties

### Property 1: Transaction Balance Invariant
For any sequence of transaction operations (create, edit, delete) on an Account, the Account balance SHALL equal the initial balance plus the sum of all income transactions minus the sum of all expense transactions minus the sum of outgoing transfers plus the sum of incoming transfers.
- **Covers**: Req 4 (AC 5, 6, 7), Req 6 (AC 1, 2, 3, 4), Req 19 (AC 1, 2)
- **Type**: Invariant
- **Approach**: Generate random sequences of transactions (income, expense, transfer) with random amounts. After each operation, verify account balance equals initial_balance + Σincome - Σexpense - Σoutgoing_transfers + Σincoming_transfers.

### Property 2: Transfer Conservation
For any transfer Transaction between two Accounts, the total combined balance of the source and destination Accounts SHALL remain unchanged after the transfer.
- **Covers**: Req 4 (AC 7), Req 6 (AC 4)
- **Type**: Invariant
- **Approach**: Generate random transfer amounts between random account pairs. Verify sum(source.balance + dest.balance) before == sum after.

### Property 3: Transfer Exclusion from Monthly Summary
For any set of Transactions in a given month, the Monthly_Summary income and expense totals SHALL exclude all transfer-type Transactions.
- **Covers**: Req 4 (AC 8), Req 8 (AC 3)
- **Type**: Invariant
- **Approach**: Generate random transaction sets including transfers. Verify monthly summary income = Σ(income amounts only), expense = Σ(expense amounts only), transfers contribute zero.

### Property 4: IDR Formatting Round-Trip
For any non-negative integer amount, formatting to IDR display string and parsing back SHALL produce the original amount.
- **Covers**: Req 12 (AC 1, 2), Req 18 (AC 2)
- **Type**: Round-trip
- **Approach**: Generate random non-negative integers. Format with `formatIDR`, parse back by stripping "Rp", replacing separators. Verify equality.

### Property 5: Transaction Filter Intersection
For any combination of filters (account, category, type, month), the filtered result set SHALL be a subset of each individual filter's result set.
- **Covers**: Req 5 (AC 2, 3, 4, 5, 6), Req 23 (AC 3)
- **Type**: Metamorphic
- **Approach**: Generate random transaction sets and random filter combinations. Verify combined filter result ⊆ intersection of individual filter results.

### Property 6: Transaction Date Ordering
The Transactions page SHALL display Transactions in reverse chronological order by date, regardless of insertion order.
- **Covers**: Req 5 (AC 1)
- **Type**: Invariant
- **Approach**: Generate random transactions with random dates. Verify displayed list has dates[i] >= dates[i+1] for all i.

### Property 7: Numpad Append-Backspace Inverse
For any sequence of digit appends followed by a backspace, the Numpad display SHALL show the same value as before the last append.
- **Covers**: Req 18 (AC 2, 3)
- **Type**: Round-trip
- **Approach**: Generate random digit sequences. After appending digit d, verify backspace returns to previous state.

### Property 8: Budget Spending Consistency
For any Budget, the displayed spending total SHALL equal the sum of all expense Transaction amounts in the Budget's Category for the Budget's month.
- **Covers**: Req 9 (AC 3, 4)
- **Type**: Invariant
- **Approach**: Generate random expense transactions for budgeted categories. Verify budget.spent == Σ(expenses in category for month).

### Property 9: Budget Progress Bar Color Correctness
For any Budget with spending ratio r = spent/limit, the Budget_Progress_Bar color SHALL be green when r < 0.75, yellow when 0.75 ≤ r < 1.0, and red when r ≥ 1.0.
- **Covers**: Req 9 (AC 2)
- **Type**: Invariant
- **Approach**: Generate random (spent, limit) pairs. Verify color matches threshold rules.

### Property 10: Soft Delete Preserves Transaction History
For any Account that is soft-deleted, the count and content of associated Transactions SHALL remain unchanged.
- **Covers**: Req 3 (AC 5)
- **Type**: Invariant
- **Approach**: Generate account with random transactions. Soft-delete account. Verify transaction count and data are identical.

### Property 11: Account Reactivation Restores Net Worth
For any soft-deleted Account that is reactivated, the Net_Worth SHALL increase by exactly the reactivated Account's balance.
- **Covers**: Req 28 (AC 2, 3)
- **Type**: Round-trip
- **Approach**: Record Net_Worth before soft-delete, after soft-delete, and after reactivation. Verify net_worth_after_reactivation == net_worth_before_delete.

### Property 12: Transaction Date Validation Boundaries
For any date, the date validator SHALL accept dates in [today - 1 year, today] and reject all dates outside this range.
- **Covers**: Req 26 (AC 1, 2)
- **Type**: Invariant
- **Approach**: Generate random dates across a wide range. Verify acceptance/rejection matches the boundary rules.

### Property 13: Search Result Relevance
For any search text, every Transaction in the search results SHALL contain the search text (case-insensitive) in either the note field or the associated Category name.
- **Covers**: Req 23 (AC 1, 2)
- **Type**: Invariant
- **Approach**: Generate random transactions with random notes/categories and random search strings. Verify all results match the search predicate.

### Property 14: Confirmation Dialog Cancellation Safety
For any destructive action where the User dismisses the Confirmation_Dialog, the underlying data SHALL remain unchanged.
- **Covers**: Req 24 (AC 4)
- **Type**: Invariant
- **Approach**: Snapshot data state, trigger delete, dismiss dialog, verify data state is identical to snapshot.

### Property 15: Pagination Completeness
For any set of Transactions, loading all pages via Infinite_Scroll SHALL produce the complete set of Transactions matching the current filters, with no duplicates and no omissions.
- **Covers**: Req 22 (AC 1)
- **Type**: Invariant
- **Approach**: Generate N random transactions. Load all pages (20 per page). Verify union of all pages == full set, no duplicates, count matches.

### Property 16: Net Worth Calculation Correctness
For any set of active Accounts, Net_Worth SHALL equal the sum of all Account balances (where credit card balances are stored as negative values representing debt).
- **Covers**: Req 19 (AC 1, 2)
- **Type**: Invariant
- **Approach**: Generate random accounts with random balances and types. Verify calculateNetWorth output matches manual sum.

### Property 17: CSV Export Completeness
For any set of Transactions, the exported CSV SHALL contain exactly one row per Transaction plus a header row, with all required columns populated.
- **Covers**: Req 14 (AC 1)
- **Type**: Invariant
- **Approach**: Generate random transaction sets. Export to CSV, parse CSV. Verify row count == transaction count + 1, all columns present.

### Property 18: Preset Pre-fill Accuracy
For any Transaction_Preset, opening the Transaction_Modal from the preset SHALL pre-fill all fields with values matching the preset's stored values.
- **Covers**: Req 7 (AC 3)
- **Type**: Invariant
- **Approach**: Generate random presets. Simulate opening modal from preset. Verify each modal field matches corresponding preset field.

### Property 19: RLS Data Isolation
For any two Users A and B, User A SHALL NOT be able to read, update, or delete any data belonging to User B.
- **Covers**: Req 16 (AC 1)
- **Type**: Invariant
- **Approach**: Create two users with random data. Attempt cross-user queries. Verify all return empty results or permission errors.

### Property 20: Credit Card Debt Direction
For any Credit_Card_Account, recording an expense SHALL increase the debt (make balance more negative), and recording a payment (transfer to credit card) SHALL decrease the debt (make balance less negative).
- **Covers**: Req 10 (AC 2, 3)
- **Type**: Invariant
- **Approach**: Generate random expense and payment amounts on credit card accounts. Verify balance direction after each operation.
