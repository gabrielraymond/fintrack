-- ============================================================
-- FinTrack Personal Finance — Row Level Security Policies
-- ============================================================
-- Enables RLS on all tables and creates policies ensuring
-- each user can only access their own data.
-- Requirements: 16.1, 16.2

-- ------------------------------------------------------------
-- 1. accounts
-- ------------------------------------------------------------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. categories
-- ------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. transactions
-- ------------------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. budgets
-- ------------------------------------------------------------
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. transaction_presets
-- ------------------------------------------------------------
ALTER TABLE transaction_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own transaction_presets"
  ON transaction_presets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. user_profiles
-- ------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
