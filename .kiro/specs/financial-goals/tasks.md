# Implementation Plan: Financial Goals

## Overview

Implement the Financial Goals feature for FinTrack, enabling users to create, manage, and track financial goals with contributions, milestone notifications, and dashboard integration. The implementation follows the existing codebase patterns (Supabase migrations, Tanstack Query hooks, Tailwind components) and builds incrementally from database layer through hooks to UI.

## Tasks

- [x] 1. Create database migration for financial goals
  - [x] 1.1 Create migration file `supabase/migrations/00007_financial_goals.sql`
    - Create `financial_goals` table with columns: id (UUID PK), user_id (FK), name, category (CHECK constraint for 6 categories), target_amount (BIGINT > 0), current_amount (BIGINT DEFAULT 0), target_date (DATE nullable), note (TEXT nullable), status (CHECK 'active','completed','cancelled'), created_at, updated_at
    - Create `goal_contributions` table with columns: id (UUID PK), goal_id (FK CASCADE), user_id (FK), amount (BIGINT CHECK ≠ 0), note (TEXT nullable), created_at
    - Add indexes: `idx_financial_goals_user_status`, `idx_financial_goals_user_created`, `idx_goal_contributions_goal`, `idx_goal_contributions_user`
    - Enable RLS on both tables with user-isolation policies
    - Update notifications type CHECK constraint to include `'goal_milestone'`
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.2 Create RPC function `add_goal_contribution`
    - Validate amount > 0, goal belongs to user, goal status = 'active'
    - Atomically insert contribution + update current_amount
    - Auto-complete goal when current_amount >= target_amount
    - Check and create milestone notifications at 25%, 50%, 75%, 100% with deduplication keys
    - _Requirements: 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5, 10.4_

  - [x] 1.3 Create RPC function `withdraw_goal_contribution`
    - Validate amount > 0, amount <= current_amount, goal belongs to user, goal status IN ('active','completed')
    - Atomically insert negative contribution + update current_amount
    - Revert status from 'completed' to 'active' when current_amount drops below target_amount
    - _Requirements: 4.3, 4.4, 10.4_

- [x] 2. Add TypeScript types and update notification type
  - [x] 2.1 Add Financial Goals types to `src/types/index.ts`
    - Add `GoalCategory`, `GoalStatus`, `FinancialGoal`, `GoalContribution`, `GoalFormInput`, `ContributionFormInput` types
    - Update `NotificationType` to include `'goal_milestone'`
    - _Requirements: 10.1, 10.2_

- [x] 3. Implement goal hooks following useAccounts.ts pattern
  - [x] 3.1 Create `src/hooks/useGoals.ts` with query key factory and data fetching hooks
    - Implement `goalKeys` factory (all, list, detail, contributions, dashboard)
    - Implement `useGoals(status?)` — fetch goals with optional status filter, default sorted by created_at DESC
    - Implement `useGoalDetail(goalId)` — fetch single goal
    - Implement `useGoalContributions(goalId)` — fetch contributions sorted by created_at DESC
    - Implement `useDashboardGoals()` — fetch top 3 active goals by progress percentage
    - _Requirements: 6.2, 6.3, 6.5, 7.1, 3.5_

  - [x] 3.2 Create goal mutation hooks in `src/hooks/useGoals.ts`
    - Implement `useCreateGoal()` with optimistic insert, rollback on error
    - Implement `useUpdateGoal()` with optimistic update, rollback on error
    - Implement `useDeleteGoal()` with confirmation pattern, optimistic remove
    - Implement `useCancelGoal()` with optimistic status update to 'cancelled'
    - _Requirements: 1.3, 1.6, 2.2, 2.4, 2.5_

  - [x] 3.3 Create contribution mutation hooks in `src/hooks/useGoals.ts`
    - Implement `useAddContribution()` calling `add_goal_contribution` RPC with optimistic update
    - Implement `useWithdrawContribution()` calling `withdraw_goal_contribution` RPC with optimistic update
    - _Requirements: 3.3, 4.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement goal UI components
  - [x] 5.1 Create `src/components/goals/GoalCard.tsx`
    - Display goal name, category icon, progress bar, current_amount/target_amount (formatIDR), percentage, remaining days (if target_date set)
    - Visual states: active (normal), completed (checkmark + success color), cancelled (dimmed)
    - Action buttons: Edit, Delete, Cancel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property tests for progress calculation
    - **Property 6: Progress Calculation** — for any goal with target_amount > 0, verify progress = Math.round((current_amount / target_amount) * 100) and remaining = Math.max(0, target_amount - current_amount)
    - **Validates: Requirements 5.1, 5.4, 5.6**

  - [x] 5.3 Create `src/components/goals/GoalForm.tsx`
    - Modal form with fields: name (required), category (select with 6 options), target_amount (required, > 0), target_date (optional date picker), note (optional textarea)
    - Client-side validation: name not empty, target_amount > 0, target_date in future if provided
    - Support create and edit modes (pre-fill data in edit mode)
    - Reuse existing `Modal` component
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1_

  - [ ]* 5.4 Write property tests for goal form validation
    - **Property 1: New Goal Initialization** — for any valid GoalFormInput, created goal must have status='active' and current_amount=0
    - **Validates: Requirements 1.3**
    - **Property 2: Invalid Input Rejection** — for any GoalFormInput with empty name or target_amount ≤ 0, validation must reject
    - **Validates: Requirements 1.4**

  - [x] 5.5 Create `src/components/goals/ContributionForm.tsx`
    - Modal form with mode "add" or "withdraw", fields: amount (required, > 0), note (optional)
    - Validate withdraw amount ≤ current_amount
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [ ]* 5.6 Write property tests for contribution/withdrawal validation
    - **Property 3: Contribution and Withdrawal Amount Validation** — for any amount ≤ 0, reject; for withdrawal amount > current_amount, reject
    - **Validates: Requirements 3.2, 4.2**

  - [x] 5.7 Create `src/components/goals/GoalDetailView.tsx`
    - Display full goal info, contribution history (sorted newest first), remaining amount, estimated achievement date
    - Buttons: "Tambah Kontribusi", "Tarik Dana", "Batalkan Goal"
    - Estimation: calculate based on avg monthly contributions (min 2 positive contributions required)
    - Show warning if estimation exceeds target_date
    - Show "Estimasi tidak tersedia" message when avg monthly ≤ 0
    - _Requirements: 5.6, 3.5, 9.1, 9.2, 9.3_

  - [ ]* 5.8 Write property tests for estimation calculation
    - **Property 11: Achievement Estimation** — for any goal with ≥ 2 positive contributions and avg monthly > 0, verify estimated date = today + ceil(remaining / avg_monthly) months; if avg ≤ 0, estimation is null
    - **Validates: Requirements 9.1, 9.2**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Goals page and navigation
  - [x] 7.1 Create `src/app/(protected)/goals/page.tsx`
    - Display all goals using GoalCard components
    - Default filter: show only active goals
    - Status filter tabs: "Aktif", "Tercapai", "Dibatalkan"
    - "Tambah Goal" button opening GoalForm
    - Empty state with message and "Tambah Goal" CTA when no goals
    - Sort by created_at DESC
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write property tests for goal filtering
    - **Property 7: Status Filter Correctness** — for any set of goals with mixed statuses and any selected filter, result must only contain goals matching that status
    - **Validates: Requirements 6.3**

  - [x] 7.3 Add "Goals" navigation item to Sidebar and BottomNav
    - Add GoalIcon SVG and nav item `{ label: 'Goals', href: '/goals', icon: GoalIcon }` to both `src/components/layout/Sidebar.tsx` and `src/components/layout/BottomNav.tsx`
    - _Requirements: 6.1_

- [x] 8. Implement Dashboard goals section
  - [x] 8.1 Create `src/components/dashboard/GoalsProgressSection.tsx`
    - Display max 3 active goals with highest progress percentage
    - Each goal: name, mini progress bar, percentage
    - "Lihat Semua" link to /goals when > 3 active goals
    - Hidden when no active goals
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 8.2 Write property tests for dashboard goal selection
    - **Property 8: Dashboard Top 3 Selection** — for any set of active goals, dashboard shows exactly min(3, count) goals with highest progress
    - **Validates: Requirements 7.1**

  - [x] 8.3 Integrate GoalsProgressSection into Dashboard page
    - Add GoalsProgressSection to `src/app/(protected)/dashboard/page.tsx` between SavingsProgressSection and RecentTransactions
    - _Requirements: 7.1_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Write remaining property tests for data consistency and notifications
  - [ ]* 10.1 Write property test for current_amount consistency
    - **Property 4: current_amount equals SUM of contributions** — for any goal and any sequence of valid add/withdraw operations, current_amount must equal the sum of all contribution amounts
    - **Validates: Requirements 3.3, 4.3, 10.4**

  - [ ]* 10.2 Write property test for status consistency
    - **Property 5: Status-Progress Consistency** — after contribution, if current_amount >= target_amount then status = 'completed'; after withdrawal, if current_amount < target_amount then status = 'active'
    - **Validates: Requirements 3.4, 4.4**

  - [ ]* 10.3 Write property test for milestone notifications
    - **Property 9: Milestone Notifications at Correct Thresholds** — for any contribution crossing 25/50/75/100% for the first time, exactly one notification per crossed milestone
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [ ]* 10.4 Write property test for milestone deduplication
    - **Property 10: No Duplicate Milestone Notifications** — repeated contributions past the same milestone must not create duplicate notifications
    - **Validates: Requirements 8.5**

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All hooks follow the existing `useAccounts.ts` pattern with Tanstack Query + optimistic updates
- Migration file follows the existing naming convention (00007_)
- RPC functions handle atomicity for contribution operations and milestone notification creation
