-- ============================================================
-- FinTrack Personal Finance — Initial Schema Migration
-- ============================================================
-- Creates all core tables, CHECK constraints, UNIQUE constraints,
-- and performance indexes.
-- Requirements: 3.1, 27.1, 16.1

-- ------------------------------------------------------------
-- 1. accounts
-- ------------------------------------------------------------
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'e-wallet', 'cash', 'credit_card', 'investment')),
  balance BIGINT NOT NULL DEFAULT 0,
  credit_limit BIGINT,
  due_date INTEGER CHECK (due_date BETWEEN 1 AND 31),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. categories
-- ------------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. transactions
-- ------------------------------------------------------------
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  destination_account_id UUID REFERENCES accounts(id),
  category_id UUID REFERENCES categories(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount BIGINT NOT NULL CHECK (amount > 0),
  note TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. budgets
-- ------------------------------------------------------------
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  month DATE NOT NULL,
  limit_amount BIGINT NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month)
);

-- ------------------------------------------------------------
-- 5. transaction_presets
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. user_profiles
-- ------------------------------------------------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_id);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX idx_accounts_user_deleted ON accounts(user_id, is_deleted);
