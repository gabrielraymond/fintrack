-- ============================================================
-- FinTrack Enhancements — Schema Migration
-- ============================================================
-- 1. Creates notifications table with RLS
-- 2. Extends accounts table with new types and target_amount
-- 3. Extends user_profiles with theme and notification preferences

-- ------------------------------------------------------------
-- 1. notifications table
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_alert', 'cc_reminder', 'large_transaction')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  deduplication_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique partial index for deduplication
CREATE UNIQUE INDEX idx_notifications_dedup
  ON notifications(user_id, deduplication_key)
  WHERE deduplication_key IS NOT NULL;

-- Composite index for fetching unread notifications
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. accounts table — add new types and target_amount
-- ------------------------------------------------------------
ALTER TABLE accounts
  DROP CONSTRAINT accounts_type_check,
  ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('bank', 'e-wallet', 'cash', 'credit_card', 'investment', 'tabungan', 'dana_darurat'));

ALTER TABLE accounts ADD COLUMN target_amount BIGINT;

-- ------------------------------------------------------------
-- 3. user_profiles table — add theme and notification prefs
-- ------------------------------------------------------------
ALTER TABLE user_profiles
  ADD COLUMN theme_preference TEXT NOT NULL DEFAULT 'system'
    CHECK (theme_preference IN ('light', 'dark', 'system')),
  ADD COLUMN large_transaction_threshold BIGINT NOT NULL DEFAULT 1000000;
