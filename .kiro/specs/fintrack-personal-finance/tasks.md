# Implementation Plan: FinTrack Personal Finance

## Overview

Implement FinTrack, a personal finance web app for Indonesian users using Next.js 14 (App Router), TypeScript, Tailwind CSS, Tanstack Query, Recharts, and Supabase. Tasks are ordered to build foundational layers first (types, DB, auth), then core features (accounts, transactions, budgets), then dashboard/settings, and finally polish (accessibility, error resilience, responsive layout).

## Tasks

- [x] 1. Project setup, types, and Supabase configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and install dependencies (Tanstack Query, Recharts, Supabase client libraries)
    - Create the project with App Router enabled
    - Install `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `recharts`, and dev dependencies
    - Configure `tailwind.config.ts` with design tokens for color contrast (4.5:1 minimum)
    - _Requirements: 13.3, 30.4_

  - [x] 1.2 Define TypeScript interfaces and types in `src/types/index.ts`
    - Define `Account`, `Transaction`, `Category`, `Budget`, `TransactionPreset`, `UserProfile` interfaces matching the DB schema
    - Define `TransactionModalState` type for the 5-step modal state machine
    - Define filter types (`TransactionFilters`), budget status types, and form input types
    - _Requirements: 3.1, 4.1, 9.1, 7.1_

  - [x] 1.3 Create Supabase client utilities and auth middleware
    - Create `src/lib/supabase/client.ts` (browser client)
    - Create `src/lib/supabase/server.ts` (server client)
    - Create `src/lib/supabase/middleware.ts` for silent session token refresh
    - Create Next.js `middleware.ts` at project root to intercept requests and redirect unauthenticated users to `/login`
    - _Requirements: 1.5, 29.1, 29.2, 29.3_

  - [x] 1.4 Create utility functions in `src/lib/`
    - Implement `formatIDR()` in `src/lib/formatters.ts` using `Intl.NumberFormat('id-ID', ...)` with period thousands separator and comma decimal separator
    - Implement `formatDate()` for Bahasa Indonesia date display
    - Implement `isValidTransactionDate()` in `src/lib/validators.ts` enforcing [today - 1 year, today] range
    - Implement constants in `src/lib/constants.ts` with default Indonesian categories (Makan, Transport, Kost/Sewa, etc.) and account types
    - _Requirements: 12.1, 12.2, 26.1, 26.2, 20.1_

  - [ ]* 1.5 Write property tests for utility functions
    - **Property 4: IDR Formatting Round-Trip** — format a random non-negative integer to IDR string and parse back; verify equality
    - **Property 12: Transaction Date Validation Boundaries** — generate random dates; verify acceptance in [today-1yr, today] and rejection outside
    - **Validates: Requirements 12.1, 12.2, 26.1, 26.2**

- [x] 2. Database schema, RLS, and seed data
  - [x] 2.1 Create Supabase migration for all tables
    - Create `accounts`, `categories`, `transactions`, `budgets`, `transaction_presets`, `user_profiles` tables as specified in the design
    - Add CHECK constraints for account types, transaction types, amount > 0, due_date range
    - Add UNIQUE constraint on `budgets(user_id, category_id, month)`
    - Create indexes: `idx_transactions_user_date`, `idx_transactions_user_account`, `idx_transactions_user_category`, `idx_transactions_user_type`, `idx_budgets_user_month`, `idx_accounts_user_deleted`
    - _Requirements: 3.1, 27.1, 16.1_

  - [x] 2.2 Create RLS policies for all tables
    - Enable RLS on all tables
    - Create policies ensuring `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE on each table
    - _Requirements: 16.1, 16.2_

  - [x] 2.3 Create Supabase RPC functions for atomic balance operations
    - Create `create_transaction` RPC: inserts transaction row and updates account balance(s) atomically
    - Create `update_transaction` RPC: reverses old balance effect, applies new balance effect, updates transaction row
    - Create `delete_transaction` RPC: reverses balance effect and deletes transaction row
    - _Requirements: 4.5, 4.6, 4.7, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.4 Create seed function for default categories
    - Create a Supabase trigger or function that seeds default Indonesian categories (Makan, Transport, Kost/Sewa, etc.) when a new user profile is created
    - _Requirements: 2.3, 15.1_

  - [ ]* 2.5 Write property test for RLS data isolation
    - **Property 19: RLS Data Isolation** — create two users with random data; attempt cross-user queries; verify empty results or permission errors
    - **Validates: Requirements 16.1**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Authentication and onboarding
  - [x] 4.1 Create auth pages and AuthProvider
    - Create `src/providers/AuthProvider.tsx` wrapping Supabase auth state
    - Create `src/app/(auth)/login/page.tsx` with email/password form, error display for invalid credentials, redirect param handling
    - Create `src/app/(auth)/register/page.tsx` with email/password form, error display for duplicate email, redirect to onboarding on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 29.3_

  - [x] 4.2 Create onboarding flow
    - Create `src/app/(protected)/onboarding/page.tsx` with guided account creation steps
    - On completion, set `onboarding_completed = true` in `user_profiles` and redirect to Dashboard
    - _Requirements: 2.1, 2.2_

  - [ ]* 4.3 Write unit tests for auth flow
    - Test login with valid/invalid credentials
    - Test registration with new/duplicate email
    - Test redirect to login for unauthenticated access
    - Test session expiry redirect with preserved URL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 29.2, 29.3_

- [x] 5. Reusable UI components and layout
  - [x] 5.1 Create UI primitive components in `src/components/ui/`
    - Implement `Button.tsx`, `Card.tsx`, `Modal.tsx` (with focus trap, Escape to close, keyboard navigation)
    - Implement `ConfirmationDialog.tsx` with optional typed confirmation phrase support
    - Implement `ErrorToast.tsx` with retry button support
    - Implement `SkeletonLoader.tsx` for loading states
    - Implement `EmptyState.tsx` for empty data views with Bahasa Indonesia messages
    - Implement `FAB.tsx` (Floating Action Button)
    - All components must include proper `aria-label`, `role`, `tabIndex` attributes
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 25.1, 25.2, 25.3, 25.4, 21.1, 30.1, 30.2, 30.3_

  - [x] 5.2 Create responsive layout components
    - Implement `src/components/layout/BottomNav.tsx` (visible < 768px) with navigation items in Bahasa Indonesia
    - Implement `src/components/layout/Sidebar.tsx` (visible >= 768px) with navigation items in Bahasa Indonesia
    - Implement `src/components/layout/ResponsiveShell.tsx` combining Sidebar and BottomNav
    - Create `src/app/(protected)/layout.tsx` using ResponsiveShell
    - _Requirements: 13.1, 13.2, 13.3, 20.1_

  - [x] 5.3 Create providers
    - Create `src/providers/QueryProvider.tsx` wrapping Tanstack Query's `QueryClientProvider`
    - Create `src/providers/ToastProvider.tsx` for error/success toast management
    - Wire providers in `src/app/layout.tsx` root layout
    - _Requirements: 21.1, 21.2_

  - [ ]* 5.4 Write property test for Confirmation Dialog cancellation safety
    - **Property 14: Confirmation Dialog Cancellation Safety** — snapshot data state, trigger delete, dismiss dialog, verify data unchanged
    - **Validates: Requirements 24.4**

- [x] 6. Account management
  - [x] 6.1 Create account hooks and data layer
    - Implement `src/hooks/useAccounts.ts` with Tanstack Query for CRUD operations, optimistic updates, and error handling with retry
    - Support fetching active accounts, soft-deleted accounts, and pagination for > 20 accounts
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 22.2, 28.1_

  - [x] 6.2 Create account page and components
    - Create `src/app/(protected)/accounts/page.tsx` displaying account cards with loading skeletons and empty state
    - Implement `src/components/accounts/AccountCard.tsx` showing name, type, balance in IDR, negative balances in red
    - Implement `src/components/accounts/AccountForm.tsx` for create/edit with name, type, initial balance fields
    - Implement `src/components/accounts/CreditCardProgress.tsx` showing debt vs credit limit progress bar and due date warning (within 7 days)
    - Implement `src/components/accounts/SoftDeletedAccounts.tsx` with toggle/tab to view and restore soft-deleted accounts
    - Wire soft-delete with ConfirmationDialog, reactivation restores balance and Net_Worth
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.1, 10.4, 11.1, 11.2, 28.1, 28.2, 28.3, 25.1, 25.3_

  - [ ]* 6.3 Write property tests for account operations
    - **Property 10: Soft Delete Preserves Transaction History** — soft-delete account, verify transaction count and data unchanged
    - **Property 11: Account Reactivation Restores Net Worth** — record Net_Worth before delete, after delete, after reactivation; verify restoration
    - **Validates: Requirements 3.5, 28.2, 28.3**

  - [ ]* 6.4 Write property test for credit card debt direction
    - **Property 20: Credit Card Debt Direction** — expense increases debt (more negative), payment decreases debt (less negative)
    - **Validates: Requirements 10.2, 10.3**

- [x] 7. Category management
  - [x] 7.1 Create category hooks and components
    - Implement `src/hooks/useCategories.ts` with Tanstack Query for CRUD, including prevention of deleting categories with associated transactions
    - Category management UI will be part of Settings page (task 13), but hook and logic are built here
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Transaction creation (5-step modal)
  - [x] 9.1 Create transaction hooks
    - Implement `src/hooks/useTransactions.ts` with Tanstack Query for create, edit, delete operations
    - Use mutations calling Supabase RPC functions for atomic balance updates
    - Implement optimistic updates and error handling with retry toast
    - _Requirements: 4.5, 4.6, 4.7, 6.1, 6.2, 6.3, 6.4, 21.1, 21.2_

  - [x] 9.2 Implement Transaction Modal with 5-step flow
    - Create `src/components/transactions/TransactionModal/index.tsx` managing state machine (`type` → `category` → `numpad` → `account` → `details`)
    - Create `TypeStep.tsx`: income, expense, transfer selection
    - Create `CategoryStep.tsx`: category grid (skipped for transfers)
    - Create `NumpadStep.tsx`: digit buttons (0-9), backspace, confirm; real-time IDR formatting; zero amount validation
    - Create `AccountStep.tsx`: account selection, dual account selection for transfers
    - Create `DetailsStep.tsx`: note input, date picker with validation [today-1yr, today], confirm button
    - Implement focus trap and keyboard navigation (Escape to close, Tab cycling)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 18.1, 18.2, 18.3, 18.4, 26.1, 26.2, 26.3, 30.3_

  - [ ]* 9.3 Write property tests for transaction operations
    - **Property 1: Transaction Balance Invariant** — generate random transaction sequences; verify account balance = initial + Σincome - Σexpense - Σoutgoing + Σincoming
    - **Property 2: Transfer Conservation** — generate random transfers; verify combined balance of source + dest unchanged
    - **Validates: Requirements 4.5, 4.6, 4.7, 6.1, 6.2, 6.3, 6.4**

  - [ ]* 9.4 Write property test for Numpad
    - **Property 7: Numpad Append-Backspace Inverse** — generate random digit sequences; verify backspace returns to previous state
    - **Validates: Requirements 18.2, 18.3**

- [x] 10. Transaction listing, filtering, search, and pagination
  - [x] 10.1 Create transaction list page with infinite scroll
    - Create `src/app/(protected)/transactions/page.tsx` with date-grouped reverse chronological list
    - Implement `src/components/transactions/TransactionList.tsx` with grouped display
    - Implement `src/hooks/useInfiniteScroll.ts` using IntersectionObserver + Tanstack Query `useInfiniteQuery` with 20 items per page
    - Display loading indicator during fetch, skeleton loaders on initial load, empty state message ("Belum ada transaksi")
    - _Requirements: 5.1, 22.1, 22.3, 25.1, 25.2_

  - [x] 10.2 Create transaction filters and search
    - Implement `src/components/transactions/TransactionFilters.tsx` with filter by account, category, type, month
    - Implement `src/components/transactions/TransactionSearch.tsx` with case-insensitive search on note and category name
    - Support combining multiple filters and search simultaneously
    - Clearing search restores full list respecting active filters
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 23.1, 23.2, 23.3_

  - [x] 10.3 Implement transaction edit and delete
    - Edit opens Transaction Modal pre-filled with existing values
    - On edit: reverse old balance effect, apply new balance effect via RPC
    - On delete: show ConfirmationDialog with transaction details, reverse balance effect via RPC
    - Transfer delete reverses both source and destination balances
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 24.1_

  - [ ]* 10.4 Write property tests for listing and filtering
    - **Property 5: Transaction Filter Intersection** — combined filter result ⊆ intersection of individual filter results
    - **Property 6: Transaction Date Ordering** — displayed list has dates[i] >= dates[i+1]
    - **Property 13: Search Result Relevance** — every result contains search text in note or category name
    - **Property 15: Pagination Completeness** — loading all pages produces complete set, no duplicates, no omissions
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 22.1, 23.1, 23.2**

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Budget management
  - [x] 12.1 Create budget hooks and data layer
    - Implement `src/hooks/useBudgets.ts` with Tanstack Query for CRUD
    - Implement duplicate prevention: query existing budgets for selected month, disable already-budgeted categories in form
    - Handle DB unique constraint violation with user-friendly error message
    - Budget spending recalculates when transactions are created, edited, or deleted
    - _Requirements: 9.1, 9.3, 9.4, 27.1, 27.2_

  - [x] 12.2 Create budget page and components
    - Create `src/app/(protected)/budgets/page.tsx` with loading skeletons and empty state ("Belum ada anggaran")
    - Implement `src/components/budgets/BudgetCard.tsx` showing category, limit, spent, remaining
    - Implement `src/components/budgets/BudgetProgressBar.tsx` with color coding: green < 75%, yellow 75-100%, red >= 100%
    - Implement `src/components/budgets/BudgetForm.tsx` with category selector (disabled for already-budgeted), month picker, limit amount input
    - _Requirements: 9.1, 9.2, 25.1, 25.4_

  - [ ]* 12.3 Write property tests for budget operations
    - **Property 8: Budget Spending Consistency** — budget spending total = Σ expenses in category for month
    - **Property 9: Budget Progress Bar Color Correctness** — color matches threshold rules for any (spent, limit) pair
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 13. Quick presets and settings page
  - [x] 13.1 Create preset hooks and components
    - Implement `src/hooks/usePresets.ts` with Tanstack Query for CRUD
    - Implement `src/components/transactions/TransactionPresetChips.tsx` as horizontally scrollable chips on Dashboard
    - Tapping a preset chip opens Transaction Modal pre-filled with preset values
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.2 Create settings page
    - Create `src/app/(protected)/settings/page.tsx` with sections: profile management, transaction presets (edit/delete), categories (edit/delete with in-use protection), CSV export, danger zone
    - Implement profile update form
    - Implement preset management (edit/delete)
    - Implement category management (edit/delete, prevent deletion of in-use categories)
    - Implement danger zone with account deletion requiring typed confirmation phrase via ConfirmationDialog
    - _Requirements: 17.1, 17.2, 7.4, 15.2, 15.3, 15.4, 24.3_

  - [x] 13.3 Implement CSV export
    - Implement `src/lib/csv-export.ts` with `exportTransactionsCSV()` generating CSV with columns: Tanggal, Tipe, Kategori, Jumlah, Akun, Catatan
    - Trigger browser download of generated file
    - Wire export button in Settings page
    - _Requirements: 14.1, 14.2_

  - [ ]* 13.4 Write property tests for presets and CSV
    - **Property 17: CSV Export Completeness** — exported CSV has exactly one row per transaction plus header, all columns populated
    - **Property 18: Preset Pre-fill Accuracy** — opening modal from preset pre-fills all fields matching preset values
    - **Validates: Requirements 14.1, 7.3**

- [x] 14. Dashboard
  - [x] 14.1 Create Net Worth and account summary components
    - Implement `src/hooks/useNetWorth.ts` computing sum of all active account balances (credit card balances stored as negative)
    - Implement `src/components/dashboard/NetWorthCard.tsx` displaying formatted IDR net worth
    - Implement `src/components/dashboard/AccountSummaryStrip.tsx` showing each account name and balance
    - _Requirements: 8.1, 8.2, 19.1, 19.2_

  - [x] 14.2 Create monthly summary and cash flow chart
    - Implement `src/components/dashboard/MonthlySummaryCard.tsx` showing total income, total expenses, net change for current month (excluding transfers)
    - Implement `src/components/dashboard/CashFlowChart.tsx` using Recharts to visualize income vs expenses over the current month
    - _Requirements: 8.3, 8.4, 4.8_

  - [x] 14.3 Create budget progress and recent transactions sections
    - Implement `src/components/dashboard/BudgetProgressSection.tsx` showing active budget progress bars
    - Implement `src/components/dashboard/RecentTransactions.tsx` showing 5 most recent transactions
    - _Requirements: 8.5, 8.6_

  - [x] 14.4 Assemble dashboard page
    - Create `src/app/(protected)/dashboard/page.tsx` composing all dashboard components
    - Add skeleton loaders for all sections during data fetch
    - Add FAB button opening Transaction Modal
    - Add Transaction Preset chips section
    - Display credit card due date warnings
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 4.1, 7.2, 10.4, 25.1_

  - [ ]* 14.5 Write property tests for dashboard calculations
    - **Property 3: Transfer Exclusion from Monthly Summary** — monthly summary income/expense totals exclude transfers
    - **Property 16: Net Worth Calculation Correctness** — net worth = sum of all active account balances
    - **Validates: Requirements 4.8, 8.3, 19.1, 19.2**

- [x] 15. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Error resilience, accessibility, and final polish
  - [x] 16.1 Implement error resilience across all mutations
    - Ensure all create/update/delete mutations display ErrorToast with descriptive Bahasa Indonesia message and retry button on network failure
    - Ensure all data fetch failures display error state with retry option in affected view
    - _Requirements: 21.1, 21.2, 21.3_

  - [x] 16.2 Accessibility audit and fixes
    - Verify all interactive elements have proper `aria-label`, `role`, `tabIndex`
    - Verify focus trap in Modal, ConfirmationDialog, and dropdown menus
    - Verify keyboard navigation: Escape closes modals, Enter/Space activates buttons, Tab cycles through elements
    - Verify semantic HTML usage (`<nav>`, `<main>`, `<button>`, `<dialog>`, `<form>`)
    - Verify color contrast minimum 4.5:1 for all text
    - _Requirements: 30.1, 30.2, 30.3, 30.4_

  - [x] 16.3 Create root page redirect and final wiring
    - Create `src/app/page.tsx` redirecting to `/dashboard` if authenticated, `/login` if not
    - Verify all navigation links in BottomNav and Sidebar work correctly
    - Verify all UI labels and system messages are in Bahasa Indonesia
    - _Requirements: 1.2, 1.5, 20.1_

  - [ ]* 16.4 Write integration tests for end-to-end flows
    - Test complete transaction creation flow (5-step modal → balance update → dashboard refresh)
    - Test budget creation with duplicate prevention
    - Test account soft-delete and reactivation flow
    - Test CSV export generates valid file
    - Test session expiry redirect and re-authentication
    - _Requirements: 4.1, 9.1, 27.1, 28.2, 14.1, 29.2_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit/integration tests validate specific examples and edge cases
- All monetary values stored as BIGINT (smallest IDR unit) in the database
- All UI text defaults to Bahasa Indonesia
- Supabase RPC functions ensure atomic balance operations to prevent inconsistencies
