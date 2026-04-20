# Implementation Plan: Monthly/Yearly Reports

## Overview

Implementasi halaman laporan bulanan/tahunan untuk FinTrack menggunakan Next.js App Router, Recharts, Tanstack Query, dan Supabase. Semua kalkulasi dilakukan di sisi klien melalui fungsi pure di `report-utils.ts`. Komponen presentasi menggunakan Recharts untuk visualisasi.

## Tasks

- [ ] 1. Setup pure utility functions (`report-utils.ts`)
  - [ ] 1.1 Create `src/lib/report-utils.ts` with all pure aggregation functions
    - Implement `calculateReportSummary`, `calculateCategoryExpenses`, `calculateMonthlyTrend`, `calculatePercentageChange`, `calculateMonthOverMonth`, `calculateYearlySummary`
    - Implement `formatIDRShort`, `getShortMonthName`, `getFullMonthName`, `getCategoryColors`
    - Implement `canNavigateNext`, `getPreviousMonth`, `getNextMonth`, `getComparisonIndicator`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.5, 4.1, 4.2, 4.3, 5.1, 5.3, 5.4, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.5, 8.1, 8.2, 8.3, 8.4, 8.6_

  - [ ]* 1.2 Write property test: Report Summary Correctness
    - **Property 1: Report Summary Correctness**
    - **Validates: Requirements 7.1, 8.1, 8.2**

  - [ ]* 1.3 Write property test: Transfer Exclusion Invariant
    - **Property 2: Transfer Exclusion Invariant**
    - **Validates: Requirements 3.5, 5.6, 7.5**

  - [ ]* 1.4 Write property test: Category Expense Aggregation
    - **Property 3: Category Expense Aggregation**
    - **Validates: Requirements 3.1, 3.3, 4.1, 4.2, 4.3**

  - [ ]* 1.5 Write property test: Period Navigation Round-Trip
    - **Property 4: Period Navigation Round-Trip**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 1.6 Write property test: Indonesian Month Name Mapping
    - **Property 5: Indonesian Month Name Mapping**
    - **Validates: Requirements 2.4, 5.3, 8.6**

  - [ ]* 1.7 Write property test: Future Month Navigation Constraint
    - **Property 6: Future Month Navigation Constraint**
    - **Validates: Requirements 2.5**

  - [ ]* 1.8 Write property test: Monthly Trend Calculation
    - **Property 7: Monthly Trend Calculation**
    - **Validates: Requirements 5.1**

  - [ ]* 1.9 Write property test: Percentage Change Mathematical Correctness
    - **Property 8: Percentage Change Mathematical Correctness**
    - **Validates: Requirements 6.1, 6.2, 6.7**

  - [ ]* 1.10 Write property test: Comparison Color Logic
    - **Property 9: Comparison Color Logic**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6**

  - [ ]* 1.11 Write property test: Yearly Summary Structure and Averages
    - **Property 10: Yearly Summary Structure and Averages**
    - **Validates: Requirements 8.3, 8.4**

  - [ ]* 1.12 Write property test: IDR Short Format
    - **Property 11: IDR Short Format**
    - **Validates: Requirements 5.4**

- [ ] 2. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement data fetching hook (`useReports`)
  - [ ] 3.1 Create `src/hooks/useReports.ts`
    - Implement Tanstack Query hook fetching transactions with categories and accounts join
    - Filter out soft-deleted accounts in query
    - Support monthly and yearly view modes
    - Use `report-utils.ts` functions for all aggregations
    - _Requirements: 10.1, 11.1, 11.2_

- [ ] 4. Implement UI components
  - [ ] 4.1 Create `src/components/reports/PeriodSelector.tsx`
    - Month/year navigation with prev/next buttons
    - Display Indonesian month name + year
    - Disable next button when at current month
    - ARIA labels and keyboard navigation support
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.1, 12.2_

  - [ ] 4.2 Create `src/components/reports/ViewToggle.tsx`
    - Tab toggle between "Bulanan" and "Tahunan"
    - Default to "Bulanan"
    - ARIA labels and keyboard support
    - _Requirements: 9.1, 9.4, 12.1, 12.2_

  - [ ] 4.3 Create `src/components/reports/ReportSummaryCard.tsx`
    - Display total income, expenses, and net change in IDR format
    - Green color for positive net, red for negative
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 4.4 Create `src/components/reports/ExpensePieChart.tsx`
    - Recharts PieChart with ResponsiveContainer
    - Color-coded segments with percentage labels
    - Tooltip with category name + IDR amount
    - Accessible data table for screen readers
    - Empty state message when no expense data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 12.3, 13.3_

  - [ ] 4.5 Create `src/components/reports/CategoryBreakdown.tsx`
    - Sorted list of categories with icon, name, IDR amount, percentage, colored progress bar
    - Colors matching pie chart segments
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.6 Create `src/components/reports/IncomeExpenseTrendChart.tsx`
    - Recharts BarChart with ResponsiveContainer
    - Green bars for income, red for expenses
    - Indonesian short month labels on X-axis
    - IDR short format on Y-axis
    - Tooltip with month, income, and expense in IDR
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.3_

  - [ ] 4.7 Create `src/components/reports/MonthOverMonthComparison.tsx`
    - Comparison cards for income, expenses, net change
    - Percentage change with colored arrow indicators
    - Inverted color logic for expenses
    - Display "-" when previous month has no data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 4.8 Create `src/components/reports/YearlySummaryView.tsx`
    - Annual totals: income, expenses, net change
    - Monthly averages
    - 12-month bar chart with Indonesian month labels
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 4.9 Create `src/components/reports/ReportSkeletonLoader.tsx`
    - Skeleton matching expected layout for loading state
    - _Requirements: 10.1_

- [ ] 5. Assemble Reports page and navigation
  - [ ] 5.1 Create `src/app/(protected)/reports/page.tsx`
    - Wire PeriodSelector, ViewToggle, and all report components
    - Conditional rendering based on monthly/yearly view
    - Loading skeleton, empty state, and error state handling
    - Responsive layout: single column < 768px, side-by-side pie chart + breakdown ≥ 768px
    - _Requirements: 9.2, 9.3, 10.1, 10.2, 10.3, 13.1, 13.2_

  - [ ] 5.2 Add "Laporan" navigation item to Sidebar and BottomNav
    - Add nav item with chart icon pointing to `/reports`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.3 Write unit tests for Reports page components
    - Test loading state, empty state, error state rendering
    - Test view toggle switches between monthly and yearly components
    - Test PeriodSelector default state and navigation constraints
    - Test accessibility: ARIA labels, keyboard navigation, screen reader table
    - _Requirements: 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 12.1, 12.2, 12.3_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `fast-check` needs to be installed as a dev dependency for property-based tests
- All pure calculation logic is in `report-utils.ts` for easy testing
- Property tests validate universal correctness properties across generated inputs
- Unit tests validate specific rendering examples and edge cases
