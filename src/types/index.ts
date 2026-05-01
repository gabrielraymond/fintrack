// ============================================================
// Enums / Union Types
// ============================================================

export type AccountType = 'bank' | 'e-wallet' | 'cash' | 'credit_card' | 'investment' | 'tabungan' | 'dana_darurat' | 'gold';

export type GoldBrand = 'antam' | 'galeri24';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type BudgetStatus = 'green' | 'yellow' | 'red';

export type NotificationType = 'budget_alert' | 'cc_reminder' | 'large_transaction' | 'goal_milestone';

export type GoalCategory = 'tabungan' | 'dana_darurat' | 'liburan' | 'pendidikan' | 'pelunasan_hutang' | 'lainnya';

export type GoalStatus = 'active' | 'completed' | 'cancelled';

// ============================================================
// Database Entity Interfaces
// ============================================================

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  credit_limit: number | null;
  due_date: number | null;
  target_amount: number | null;
  gold_brand: GoldBrand | null;
  gold_weight_grams: number | null;
  gold_purchase_price_per_gram: number | null;
  invested_amount: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  category: GoalCategory;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  note: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number; // positif = kontribusi, negatif = penarikan
  note: string | null;
  account_id: string | null;
  created_at: string;
}

export interface GoalContributionWithAccount extends GoalContribution {
  account?: {
    id: string;
    name: string;
    is_deleted: boolean;
  } | null;
}

export interface TransactionPreset {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  category_id: string | null;
  account_id: string;
  destination_account_id: string | null;
  amount: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  onboarding_completed: boolean;
  theme_preference: 'light' | 'dark' | 'system';
  large_transaction_threshold: number;
  cutoff_date: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  deduplication_key: string | null;
  created_at: string;
}

// ============================================================
// Transaction Modal State Machine
// ============================================================

export type TransactionModalStep = 'type' | 'category' | 'numpad' | 'account' | 'details';

export type TransactionModalState = {
  step: TransactionModalStep;
  type: TransactionType | null;
  categoryId: string | null;
  amount: number;
  accountId: string | null;
  destinationAccountId: string | null;
  note: string;
  date: Date;
};

// ============================================================
// Filters
// ============================================================

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  month?: string;
  search?: string;
}

// ============================================================
// Form Input Types
// ============================================================

export interface AccountFormInput {
  name: string;
  type: AccountType;
  balance: number;
  credit_limit?: number;
  due_date?: number;
  target_amount?: number;
  gold_brand?: GoldBrand;
  gold_weight_grams?: number;
  gold_purchase_price_per_gram?: number;
  invested_amount?: number;
}

export interface TransactionFormInput {
  type: TransactionType;
  account_id: string;
  destination_account_id?: string;
  category_id?: string;
  amount: number;
  note?: string;
  date: string;
}

export interface BudgetFormInput {
  category_id: string;
  month: string;
  limit_amount: number;
}

export interface PresetFormInput {
  name: string;
  type: TransactionType;
  category_id?: string;
  account_id: string;
  destination_account_id?: string;
  amount: number;
}

export interface CategoryFormInput {
  name: string;
  icon: string;
}

export interface ProfileFormInput {
  display_name: string;
}

export interface GoalFormInput {
  name: string;
  category: GoalCategory;
  target_amount: number;
  target_date?: string;
  note?: string;
}

export interface ContributionFormInput {
  amount: number;
  note?: string;
  account_id: string;
}

// ============================================================
// Computed / Display Types
// ============================================================

export interface BudgetWithSpending extends Budget {
  spent: number;
  status: BudgetStatus;
  category?: Category;
}

export interface TransactionWithRelations extends Transaction {
  category?: Category;
  account?: Account;
  destination_account?: Account;
}
