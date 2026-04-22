# Implementation Plan: Goal-Account Linking

## Overview

Link Financial Goal contributions and withdrawals to specific Accounts with atomic balance transfers. Implementation proceeds bottom-up: database migration → RPC function updates → TypeScript types → React Query hooks → UI components → page wiring.

## Tasks

- [x] 1. Database migration: add `account_id` column and update RPC functions
  - [x] 1.1 Create migration file `supabase/migrations/00008_goal_account_linking.sql`
    - Add nullable `account_id UUID REFERENCES accounts(id)` column to `goal_contributions`
    - Create index `idx_goal_contributions_account` on `goal_contributions(account_id)`
    - _Requirements: 5.1, 7.1_

  - [x] 1.2 Update `add_goal_contribution` RPC function in the same migration
    - Add parameter `p_account_id UUID DEFAULT NULL`
    - When `p_account_id IS NOT NULL`: validate account ownership (`user_id`), validate `is_deleted = false`, validate `balance >= p_amount`, then `UPDATE accounts SET balance = balance - p_amount`
    - Insert `goal_contributions` row with `account_id = p_account_id`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.3_

  - [x] 1.3 Update `withdraw_goal_contribution` RPC function in the same migration
    - Add parameter `p_account_id UUID DEFAULT NULL`
    - When `p_account_id IS NOT NULL`: validate account ownership (`user_id`), validate `is_deleted = false`, then `UPDATE accounts SET balance = balance + p_amount`
    - Insert `goal_contributions` row with `account_id = p_account_id`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4_

- [x] 2. Update TypeScript types and hook interfaces
  - [x] 2.1 Extend types in `src/types/index.ts`
    - Add `account_id: string` to `ContributionFormInput`
    - Add `GoalContributionWithAccount` interface extending `GoalContribution` with optional `account` object (`{ id, name, is_deleted }`)
    - Add `account_id: string | null` to `GoalContribution`
    - _Requirements: 5.1, 5.2_

  - [x] 2.2 Update `useAddContribution` in `src/hooks/useGoals.ts`
    - Add `accountId: string` to mutation input type
    - Pass `p_account_id` to RPC call
    - Add optimistic update for account balance decrease in accounts cache
    - Invalidate `accountKeys.all` on settled
    - _Requirements: 2.1, 2.2_

  - [x] 2.3 Update `useWithdrawContribution` in `src/hooks/useGoals.ts`
    - Add `accountId: string` to mutation input type
    - Pass `p_account_id` to RPC call
    - Add optimistic update for account balance increase in accounts cache
    - Invalidate `accountKeys.all` on settled
    - _Requirements: 4.1, 4.2_

  - [x] 2.4 Update `useGoalContributions` in `src/hooks/useGoals.ts`
    - Change query to select `*, accounts:account_id(id, name, is_deleted)` for join
    - Return `GoalContributionWithAccount[]`
    - _Requirements: 5.2, 5.3_

- [x] 3. Checkpoint
  - Ensure all type changes compile without errors, ask the user if questions arise.

- [x] 4. Update ContributionForm UI with account selection
  - [x] 4.1 Add account dropdown to `src/components/goals/ContributionForm.tsx`
    - Add `accounts: Account[]` prop
    - Add `accountId` state and `<select>` dropdown
    - Label: "Pilih Akun Sumber" (add mode) / "Pilih Akun Tujuan" (withdraw mode)
    - Each option shows `account.name — formatIDR(account.balance)`
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

  - [x] 4.2 Add account validation to ContributionForm
    - Require account selection before submit (error: "Pilih akun sumber terlebih dahulu" / "Pilih akun tujuan terlebih dahulu")
    - In add mode: validate amount ≤ selected account balance (error: "Saldo akun tidak mencukupi")
    - Include `account_id` in `ContributionFormInput` output
    - _Requirements: 1.3, 1.4, 1.5, 3.3, 3.4_

  - [ ]* 4.3 Write unit tests for ContributionForm account dropdown
    - Test dropdown renders with active accounts only
    - Test account selection required validation (add and withdraw modes)
    - Test insufficient balance validation in add mode
    - Test `account_id` included in form output
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.1, 3.3, 3.4_

  - [ ]* 4.4 Write property tests for ContributionForm account filtering and validation
    - **Property 1: Dropdown Hanya Menampilkan Account Aktif**
    - **Validates: Requirements 1.1, 3.1**
    - **Property 2: Dropdown Menampilkan Nama dan Saldo Account**
    - **Validates: Requirements 1.2, 3.2**
    - **Property 3: Validasi Saldo Account Sumber pada Kontribusi**
    - **Validates: Requirements 1.5**

- [x] 5. Update GoalDetailView to show account names in contribution history
  - [x] 5.1 Update `src/components/goals/GoalDetailView.tsx`
    - Use `GoalContributionWithAccount` type for contributions
    - Display account name next to each contribution amount
    - Show "(tidak aktif)" indicator for soft-deleted accounts
    - Show nothing extra for legacy contributions without `account_id`
    - _Requirements: 5.2, 5.3_

  - [ ]* 5.2 Write unit tests for GoalDetailView account display
    - Test account name shown in contribution history
    - Test "(tidak aktif)" shown for deleted accounts
    - Test legacy contributions without account_id render correctly
    - _Requirements: 5.2, 5.3_

  - [ ]* 5.3 Write property test for contribution history account display
    - **Property 7: Riwayat Kontribusi Menampilkan Nama Account**
    - **Validates: Requirements 5.2**

- [x] 6. Wire everything together in Goals Page
  - [x] 6.1 Update `src/app/(protected)/goals/page.tsx`
    - Import and call `useAccounts` to fetch active accounts
    - Pass `accounts` array to `ContributionForm`
    - Pass `accountId` from form data to `useAddContribution` and `useWithdrawContribution` mutations
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [ ]* 6.2 Write property tests for fund conservation
    - **Property 4: Konservasi Dana pada Kontribusi**
    - **Validates: Requirements 2.1, 7.3**
    - **Property 5: Konservasi Dana pada Penarikan**
    - **Validates: Requirements 4.1, 7.4**
    - **Property 6: Goal Contribution Menyimpan Account ID**
    - **Validates: Requirements 2.2, 4.2**

- [x] 7. Final checkpoint
  - Ensure all tests pass, verify no contributions/withdrawals create transaction rows (Requirement 6.1, 6.2, 6.3), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration is backward-compatible: existing contributions without `account_id` remain valid (nullable column)
