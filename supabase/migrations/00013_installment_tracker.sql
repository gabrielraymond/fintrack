-- ============================================================
-- FinTrack Installment & Commitment Tracker — Schema Migration
-- ============================================================
-- 1. Adds commitment_limit column to accounts
-- 2. Creates installments table with RLS
-- 3. Creates recurring_commitments table with RLS
-- 4. Creates installment_payment_logs table with RLS
-- 5. Updates notifications type CHECK to include new types
-- Requirements: 1.1, 1.6, 2.1, 2.4, 8.1, 8.4, 9.1

-- ------------------------------------------------------------
-- 1. Add commitment_limit to accounts (nullable, for non-CC accounts)
-- ------------------------------------------------------------
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS commitment_limit BIGINT;

-- ------------------------------------------------------------
-- 2. installments table
-- ------------------------------------------------------------
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  name TEXT NOT NULL,
  installment_type TEXT NOT NULL CHECK (installment_type IN ('cc', 'non_cc')),
  monthly_amount BIGINT NOT NULL CHECK (monthly_amount > 0),
  tenor_months INTEGER NOT NULL CHECK (tenor_months >= 1),
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own installments"
  ON installments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_installments_user_status ON installments(user_id, status);
CREATE INDEX idx_installments_user_account ON installments(user_id, account_id);

-- ------------------------------------------------------------
-- 3. recurring_commitments table
-- ------------------------------------------------------------
CREATE TABLE recurring_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  name TEXT NOT NULL,
  monthly_amount BIGINT NOT NULL CHECK (monthly_amount > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recurring_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own recurring_commitments"
  ON recurring_commitments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_recurring_commitments_user_active ON recurring_commitments(user_id, is_active);
CREATE INDEX idx_recurring_commitments_user_account ON recurring_commitments(user_id, account_id);

-- ------------------------------------------------------------
-- 4. installment_payment_logs table
-- ------------------------------------------------------------
CREATE TABLE installment_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID REFERENCES installments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  payment_month DATE NOT NULL, -- stored as first day of month: YYYY-MM-01
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (installment_id, payment_month)
);

ALTER TABLE installment_payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own payment_logs"
  ON installment_payment_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_payment_logs_installment_month ON installment_payment_logs(installment_id, payment_month);
CREATE INDEX idx_payment_logs_user_month ON installment_payment_logs(user_id, payment_month);

-- ------------------------------------------------------------
-- 5. Update notifications type CHECK to include new types
-- ------------------------------------------------------------
ALTER TABLE notifications
  DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'budget_alert',
      'cc_reminder',
      'large_transaction',
      'goal_milestone',
      'payment_due_today',
      'commitment_alert'
    ));
