# Requirements Document

## Introduction

FinTrack is a personal finance web application built with Next.js 14 and Supabase, designed for Indonesian users. The application enables users to track income, expenses, and balances across multiple account types (bank, e-wallet, cash, credit card, investment) using IDR currency. The application provides dashboard analytics, budget tracking, transaction management, and data export capabilities with a mobile-first responsive design.

## Glossary

- **FinTrack**: The personal finance web application being specified
- **User**: An authenticated individual who uses FinTrack to manage personal finances
- **Account**: A financial account belonging to a User, categorized as one of: bank, e-wallet, cash, credit card, or investment
- **Transaction**: A financial record representing income, expense, or transfer associated with an Account
- **Transfer**: A Transaction type that moves funds between two Accounts owned by the same User
- **Category**: A classification label for Transactions (e.g., Makan, Transport, Kost/Sewa)
- **Budget**: A monthly spending limit set by a User for a specific Category
- **Transaction_Preset**: A saved template for frequently used Transactions
- **Net_Worth**: The sum of all Account balances excluding credit card debt
- **Monthly_Summary**: An aggregation of income, expenses, and balance changes for a given calendar month
- **Dashboard**: The main overview page displaying Net_Worth, Account summaries, charts, and recent Transactions
- **Transaction_Modal**: A multi-step form used to create a new Transaction
- **Numpad**: A numeric input interface within the Transaction_Modal for entering amounts
- **FAB**: Floating Action Button used to trigger the Transaction_Modal
- **RLS**: Row Level Security, a Supabase/PostgreSQL feature ensuring data isolation per User
- **IDR**: Indonesian Rupiah, the currency used throughout FinTrack
- **Supabase_Auth**: The authentication service provided by Supabase for User registration and login
- **CSV**: Comma-Separated Values, a file format used for data export
- **Bottom_Nav**: A mobile navigation bar fixed at the bottom of the screen
- **Sidebar**: A desktop navigation panel displayed on the left side of the screen
- **Onboarding**: A guided setup flow presented to new Users after registration
- **Credit_Card_Account**: An Account of type credit card, which tracks debt rather than positive balance
- **Budget_Progress_Bar**: A visual indicator showing spending against a Budget limit
- **Error_Toast**: A temporary notification message displayed to the User indicating an error or status update
- **Skeleton_Loader**: A placeholder UI element that mimics the layout of content while data is loading
- **Infinite_Scroll**: A pagination technique that loads additional items as the User scrolls to the bottom of a list
- **Confirmation_Dialog**: A modal prompt requiring the User to confirm or cancel a destructive action before execution
- **Soft_Deleted_Account**: An Account that has been soft-deleted and is hidden from active views but retains data
- **ARIA_Label**: An accessible attribute providing a text description of a UI element for screen readers

## Requirements

### Requirement 1: User Authentication

**User Story:** As a User, I want to register and log in with email and password, so that I can securely access my personal financial data.

#### Acceptance Criteria

1. WHEN a User submits a valid email and password on the registration form, THE Supabase_Auth SHALL create a new User account and redirect the User to the Onboarding flow
2. WHEN a User submits valid credentials on the login form, THE Supabase_Auth SHALL authenticate the User and redirect to the Dashboard
3. IF a User submits invalid credentials on the login form, THEN THE Supabase_Auth SHALL display an error message indicating authentication failure
4. IF a User submits a registration form with an email already in use, THEN THE Supabase_Auth SHALL display an error message indicating the email is already registered
5. WHEN an unauthenticated visitor attempts to access a protected page, THE FinTrack SHALL redirect the visitor to the login page

### Requirement 2: User Onboarding

**User Story:** As a new User, I want to be guided through initial setup after registration, so that I can configure my accounts and start tracking finances immediately.

#### Acceptance Criteria

1. WHEN a User completes registration, THE Onboarding SHALL present a guided setup flow for creating initial Accounts
2. WHEN a User completes the Onboarding flow, THE FinTrack SHALL redirect the User to the Dashboard
3. THE FinTrack SHALL seed default Categories with Indonesian labels (Makan, Transport, Kost/Sewa, and other predefined labels) for each new User

### Requirement 3: Account Management

**User Story:** As a User, I want to create, view, edit, and soft-delete financial accounts, so that I can organize my finances across multiple account types.

#### Acceptance Criteria

1. THE FinTrack SHALL support five Account types: bank, e-wallet, cash, credit card, and investment
2. WHEN a User submits the add Account form with a valid name, type, and initial balance, THE FinTrack SHALL create the Account and display it on the Accounts page
3. WHEN a User views the Accounts page, THE FinTrack SHALL display each Account as a card showing the account name, type, and current balance formatted in IDR
4. WHILE an Account is of type credit card, THE FinTrack SHALL display a progress bar showing current debt against the credit limit
5. WHEN a User requests to delete an Account, THE FinTrack SHALL perform a soft delete, hiding the Account from active views while preserving associated Transaction history
6. WHEN a User edits an Account name or type, THE FinTrack SHALL update the Account and reflect changes across all views

### Requirement 4: Transaction Creation

**User Story:** As a User, I want to add transactions through a guided multi-step modal, so that I can record income, expenses, and transfers accurately.

#### Acceptance Criteria

1. WHEN a User taps the FAB on the Dashboard, THE Transaction_Modal SHALL open with a 5-step flow: type selection, category grid, Numpad input, account selection, and details entry
2. WHEN a User selects a Transaction type of income or expense, THE Transaction_Modal SHALL present the Category grid for selection
3. WHEN a User enters an amount using the Numpad, THE Transaction_Modal SHALL display the amount formatted in IDR in real time
4. WHEN a User selects a transfer type, THE Transaction_Modal SHALL require selection of both a source Account and a destination Account
5. WHEN a User confirms a Transaction of type expense, THE FinTrack SHALL deduct the amount from the selected Account balance
6. WHEN a User confirms a Transaction of type income, THE FinTrack SHALL add the amount to the selected Account balance
7. WHEN a User confirms a Transaction of type transfer, THE FinTrack SHALL deduct the amount from the source Account and add the amount to the destination Account
8. THE FinTrack SHALL NOT count transfer Transactions as income or expense in the Monthly_Summary

### Requirement 5: Transaction Listing and Filtering

**User Story:** As a User, I want to view and filter my transaction history, so that I can review and analyze my spending patterns.

#### Acceptance Criteria

1. WHEN a User navigates to the Transactions page, THE FinTrack SHALL display Transactions grouped by date in reverse chronological order
2. WHEN a User applies a filter by Account, THE FinTrack SHALL display only Transactions associated with the selected Account
3. WHEN a User applies a filter by Category, THE FinTrack SHALL display only Transactions matching the selected Category
4. WHEN a User applies a filter by Transaction type (income, expense, transfer), THE FinTrack SHALL display only Transactions of the selected type
5. WHEN a User applies a filter by month, THE FinTrack SHALL display only Transactions within the selected calendar month
6. THE FinTrack SHALL support combining multiple filters simultaneously

### Requirement 6: Transaction Editing and Deletion

**User Story:** As a User, I want to edit or delete existing transactions, so that I can correct mistakes and keep my records accurate.

#### Acceptance Criteria

1. WHEN a User edits a Transaction amount, THE FinTrack SHALL reverse the original balance effect on the associated Account and apply the new amount
2. WHEN a User edits a Transaction to change the associated Account, THE FinTrack SHALL reverse the balance effect on the original Account and apply the balance effect to the new Account
3. WHEN a User deletes a Transaction, THE FinTrack SHALL reverse the balance effect on the associated Account
4. WHEN a User deletes a transfer Transaction, THE FinTrack SHALL reverse the balance effects on both the source Account and the destination Account

### Requirement 7: Quick Transaction Presets

**User Story:** As a User, I want to save and use transaction presets, so that I can quickly record frequent transactions without re-entering details.

#### Acceptance Criteria

1. WHEN a User creates a Transaction_Preset with a name, type, Category, amount, and Account, THE FinTrack SHALL save the preset for future use
2. WHEN a User views the Dashboard, THE FinTrack SHALL display saved Transaction_Presets as horizontally scrollable chips
3. WHEN a User taps a Transaction_Preset chip, THE Transaction_Modal SHALL open pre-filled with the preset values
4. WHEN a User navigates to the Settings page, THE FinTrack SHALL allow the User to edit and delete Transaction_Presets

### Requirement 8: Dashboard Overview

**User Story:** As a User, I want to see a comprehensive financial overview on the dashboard, so that I can understand my current financial status at a glance.

#### Acceptance Criteria

1. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display a Net_Worth card showing the total of all Account balances excluding Credit_Card_Account debt
2. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display an account summary strip showing each Account name and balance
3. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display a Monthly_Summary card showing total income, total expenses, and net change for the current month
4. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display a cash flow chart (using Recharts) visualizing income and expenses over the current month
5. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display Budget_Progress_Bars for active Budgets
6. WHEN a User navigates to the Dashboard, THE FinTrack SHALL display the five most recent Transactions

### Requirement 9: Budget Management

**User Story:** As a User, I want to set monthly budgets per category, so that I can control my spending and stay within limits.

#### Acceptance Criteria

1. WHEN a User creates a Budget with a Category, month, and limit amount, THE FinTrack SHALL save the Budget and display it on the Budgets page
2. WHEN a User views the Budgets page, THE FinTrack SHALL display each Budget with a color-coded Budget_Progress_Bar: green when spending is below 75% of the limit, yellow when between 75% and 100%, and red when at or above 100%
3. WHEN a Transaction of type expense is created for a Category with an active Budget, THE FinTrack SHALL update the Budget spending total
4. WHEN a User edits or deletes a Transaction associated with a budgeted Category, THE FinTrack SHALL recalculate the Budget spending total

### Requirement 10: Credit Card Specific Logic

**User Story:** As a User, I want credit card accounts to handle debt tracking and due date warnings, so that I can manage credit card payments effectively.

#### Acceptance Criteria

1. WHILE an Account is of type credit card, THE FinTrack SHALL track the balance as debt (negative value represents amount owed)
2. WHEN a User records an expense on a Credit_Card_Account, THE FinTrack SHALL increase the debt balance
3. WHEN a User records a payment (transfer) to a Credit_Card_Account, THE FinTrack SHALL reduce the debt balance
4. WHEN a Credit_Card_Account has a configured due date within 7 days, THE FinTrack SHALL display a warning indicator on the Dashboard and Accounts page

### Requirement 11: Negative Balance Handling

**User Story:** As a User, I want the system to handle negative balances gracefully, so that I can track overdrafts and debts accurately.

#### Acceptance Criteria

1. WHEN a Transaction causes an Account balance to become negative, THE FinTrack SHALL allow the Transaction and display the negative balance with a distinct visual indicator
2. THE FinTrack SHALL display negative balances in red text across all views

### Requirement 12: Currency Formatting

**User Story:** As a User, I want all monetary values displayed in IDR format, so that I can read financial data in my local currency.

#### Acceptance Criteria

1. THE FinTrack SHALL format all monetary values using IDR currency format (e.g., Rp 1.500.000)
2. THE FinTrack SHALL use period (.) as the thousands separator and comma (,) as the decimal separator for IDR formatting

### Requirement 13: Responsive Layout and Navigation

**User Story:** As a User, I want the application to work on both mobile and desktop, so that I can manage finances from any device.

#### Acceptance Criteria

1. WHILE the viewport width is below 768px, THE FinTrack SHALL display the Bottom_Nav for navigation
2. WHILE the viewport width is 768px or above, THE FinTrack SHALL display the Sidebar for navigation
3. THE FinTrack SHALL render all pages in a mobile-first responsive layout

### Requirement 14: Data Export

**User Story:** As a User, I want to export my transaction data as CSV, so that I can analyze my finances in external tools.

#### Acceptance Criteria

1. WHEN a User requests a CSV export from the Settings page, THE FinTrack SHALL generate a CSV file containing all Transactions with columns for date, type, category, amount, account, and notes
2. WHEN the CSV file is generated, THE FinTrack SHALL trigger a browser download of the file

### Requirement 15: Category Management

**User Story:** As a User, I want to create and manage custom categories, so that I can organize transactions according to my personal classification.

#### Acceptance Criteria

1. THE FinTrack SHALL provide default Categories with Indonesian labels seeded for each new User
2. WHEN a User creates a custom Category with a name and icon, THE FinTrack SHALL save the Category and make it available for Transaction classification
3. WHEN a User navigates to the Settings page, THE FinTrack SHALL allow the User to edit and delete custom Categories
4. IF a User attempts to delete a Category that has associated Transactions, THEN THE FinTrack SHALL prevent deletion and display a message indicating the Category is in use

### Requirement 16: Data Isolation and Security

**User Story:** As a User, I want my financial data to be private and isolated, so that no other user can access my records.

#### Acceptance Criteria

1. THE RLS SHALL enforce that each User can only read, create, update, and delete their own Accounts, Transactions, Categories, Budgets, and Transaction_Presets
2. THE Supabase_Auth SHALL require a valid session token for all database operations

### Requirement 17: Settings and Profile Management

**User Story:** As a User, I want to manage my profile and application settings, so that I can customize my experience.

#### Acceptance Criteria

1. WHEN a User navigates to the Settings page, THE FinTrack SHALL display sections for profile management, Transaction_Presets, Categories, CSV export, and a danger zone for account deletion
2. WHEN a User updates their profile information, THE FinTrack SHALL save the changes and confirm the update

### Requirement 18: IDR Amount Input via Numpad

**User Story:** As a User, I want to enter transaction amounts using a dedicated numpad interface, so that I can input IDR amounts quickly and accurately on mobile.

#### Acceptance Criteria

1. WHEN the Numpad is displayed in the Transaction_Modal, THE Numpad SHALL present digit buttons (0-9), a backspace button, and a confirm button
2. WHEN a User taps digit buttons on the Numpad, THE Numpad SHALL append digits to the current amount and display the formatted IDR value in real time
3. WHEN a User taps the backspace button on the Numpad, THE Numpad SHALL remove the last digit from the current amount
4. IF a User attempts to confirm with an amount of zero, THEN THE Transaction_Modal SHALL display a validation message and prevent proceeding

### Requirement 19: Net Worth Calculation

**User Story:** As a User, I want my net worth calculated accurately, so that I can understand my true financial position.

#### Acceptance Criteria

1. THE FinTrack SHALL calculate Net_Worth as the sum of all Account balances where Credit_Card_Account balances are subtracted (since they represent debt)
2. WHEN any Account balance changes due to a Transaction, THE Dashboard SHALL reflect the updated Net_Worth

### Requirement 20: Bahasa Indonesia Default Language

**User Story:** As an Indonesian User, I want the application to default to Bahasa Indonesia, so that I can use the app in my native language.

#### Acceptance Criteria

1. THE FinTrack SHALL display all UI labels, navigation items, and system messages in Bahasa Indonesia by default


### Requirement 21: Offline and Error Resilience

**User Story:** As a User, I want the application to handle network failures gracefully, so that I do not lose data or become confused when connectivity issues occur.

#### Acceptance Criteria

1. IF a save operation (create, update, or delete Transaction, Account, Budget, or Transaction_Preset) fails due to a network error or Supabase downtime, THEN THE FinTrack SHALL display an Error_Toast with a descriptive message and a retry button
2. WHEN a User taps the retry button on an Error_Toast, THE FinTrack SHALL re-attempt the failed operation
3. IF a data fetch operation fails due to a network error, THEN THE FinTrack SHALL display an error state with a message and a retry option in the affected view

### Requirement 22: Pagination and Performance for Large Datasets

**User Story:** As a User with many transactions, I want the application to load data efficiently, so that pages remain responsive regardless of data volume.

#### Acceptance Criteria

1. WHEN a User navigates to the Transactions page, THE FinTrack SHALL load Transactions in pages of 20 items and support Infinite_Scroll to load additional pages as the User scrolls
2. WHEN a User navigates to the Accounts page with more than 20 Accounts, THE FinTrack SHALL paginate the Account list
3. WHILE additional data is being fetched during Infinite_Scroll, THE FinTrack SHALL display a loading indicator at the bottom of the list

### Requirement 23: Transaction Search

**User Story:** As a User, I want to search my transactions by note or category name, so that I can quickly find specific transactions.

#### Acceptance Criteria

1. WHEN a User enters text in the search field on the Transactions page, THE FinTrack SHALL filter the displayed Transactions to show only those whose note or Category name contains the search text (case-insensitive)
2. WHEN a User clears the search field, THE FinTrack SHALL restore the full Transaction list respecting any active filters
3. THE FinTrack SHALL combine search results with any active filters (Account, Category, type, month)

### Requirement 24: Confirmation Dialogs for Destructive Actions

**User Story:** As a User, I want to confirm before executing destructive actions, so that I do not accidentally delete important data.

#### Acceptance Criteria

1. WHEN a User requests to delete a Transaction, THE FinTrack SHALL display a Confirmation_Dialog with the Transaction details and require explicit confirmation before executing the deletion
2. WHEN a User requests to delete (soft-delete) an Account, THE FinTrack SHALL display a Confirmation_Dialog with the Account name and require explicit confirmation before executing the soft delete
3. WHEN a User requests permanent account deletion from the danger zone in Settings, THE FinTrack SHALL display a Confirmation_Dialog requiring the User to type a confirmation phrase before executing
4. WHEN a User dismisses a Confirmation_Dialog, THE FinTrack SHALL cancel the destructive action and return to the previous view

### Requirement 25: Loading and Empty States

**User Story:** As a User, I want to see loading indicators and helpful empty state messages, so that I understand when data is loading or when no data exists.

#### Acceptance Criteria

1. WHILE data is being fetched for the Dashboard, Transactions page, Accounts page, or Budgets page, THE FinTrack SHALL display Skeleton_Loader placeholders matching the layout of the expected content
2. WHEN the Transactions page loads with no Transactions for the current filters, THE FinTrack SHALL display an empty state message (e.g., "Belum ada transaksi")
3. WHEN the Accounts page loads with no Accounts, THE FinTrack SHALL display an empty state message prompting the User to create an Account
4. WHEN the Budgets page loads with no Budgets, THE FinTrack SHALL display an empty state message prompting the User to create a Budget

### Requirement 26: Transaction Date Validation

**User Story:** As a User, I want the system to validate transaction dates, so that I cannot accidentally record transactions with unreasonable dates.

#### Acceptance Criteria

1. WHEN a User selects a date for a Transaction, THE Transaction_Modal SHALL prevent selection of dates in the future
2. WHEN a User selects a date for a Transaction, THE Transaction_Modal SHALL prevent selection of dates more than 1 year in the past
3. IF a User attempts to submit a Transaction with an invalid date, THEN THE Transaction_Modal SHALL display a validation message indicating the date is out of the allowed range

### Requirement 27: Duplicate Budget Prevention

**User Story:** As a User, I want the application to prevent me from creating duplicate budgets, so that I do not accidentally set conflicting limits for the same category and month.

#### Acceptance Criteria

1. WHEN a User attempts to create a Budget for a Category and month combination that already has an active Budget, THE FinTrack SHALL display an error message indicating a Budget already exists for that Category and month
2. THE FinTrack SHALL disable or hide already-budgeted Categories in the Budget creation form for the selected month

### Requirement 28: Account Reactivation

**User Story:** As a User, I want to restore soft-deleted accounts, so that I can recover accounts that were deleted by mistake.

#### Acceptance Criteria

1. WHEN a User navigates to the Accounts page, THE FinTrack SHALL provide an option to view Soft_Deleted_Accounts
2. WHEN a User selects a Soft_Deleted_Account and requests reactivation, THE FinTrack SHALL restore the Account to active status and display it in the active Account list
3. WHEN a Soft_Deleted_Account is reactivated, THE FinTrack SHALL restore the Account balance and include the Account in Net_Worth calculations

### Requirement 29: Session Expiry Handling

**User Story:** As a User, I want the application to handle session expiry seamlessly, so that I do not lose work or encounter unexpected errors.

#### Acceptance Criteria

1. WHEN a User session token is nearing expiry, THE Supabase_Auth SHALL attempt a silent token refresh without interrupting the User
2. IF a silent token refresh fails, THEN THE FinTrack SHALL redirect the User to the login page with a message indicating the session has expired
3. WHEN a User is redirected to the login page due to session expiry, THE FinTrack SHALL preserve the URL of the page the User was on and redirect back after successful re-authentication

### Requirement 30: Accessibility

**User Story:** As a User, I want the application to be accessible via keyboard and screen readers, so that all users can navigate and use FinTrack effectively.

#### Acceptance Criteria

1. THE FinTrack SHALL support full keyboard navigation for all interactive elements including buttons, links, form fields, and modal dialogs
2. THE FinTrack SHALL provide ARIA_Labels for all interactive elements that lack visible text labels
3. THE FinTrack SHALL ensure that the Transaction_Modal, Confirmation_Dialog, and all dropdown menus are keyboard-navigable and trap focus while open
4. THE FinTrack SHALL maintain a minimum color contrast ratio of 4.5:1 for all text content against background colors
