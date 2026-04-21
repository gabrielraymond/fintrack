-- ============================================================
-- FinTrack Financial Goals — Schema Migration
-- ============================================================
-- 1. Creates financial_goals table
-- 2. Creates goal_contributions table
-- 3. Adds indexes for performance
-- 4. Enables RLS with user-isolation policies
-- 5. Updates notifications type CHECK to include 'goal_milestone'
-- Requirements: 10.1, 10.2, 10.3

-- ------------------------------------------------------------
-- 1. financial_goals
-- ------------------------------------------------------------
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tabungan', 'dana_darurat', 'liburan', 'pendidikan', 'pelunasan_hutang', 'lainnya')),
  target_amount BIGINT NOT NULL CHECK (target_amount > 0),
  current_amount BIGINT NOT NULL DEFAULT 0,
  target_date DATE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. goal_contributions
-- ------------------------------------------------------------
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES financial_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount BIGINT NOT NULL CHECK (amount <> 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_financial_goals_user_status ON financial_goals(user_id, status);
CREATE INDEX idx_financial_goals_user_created ON financial_goals(user_id, created_at DESC);
CREATE INDEX idx_goal_contributions_goal ON goal_contributions(goal_id, created_at DESC);
CREATE INDEX idx_goal_contributions_user ON goal_contributions(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- financial_goals
-- ------------------------------------------------------------
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own goals"
  ON financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- goal_contributions
-- ------------------------------------------------------------
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own contributions"
  ON goal_contributions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Update notifications type CHECK to include 'goal_milestone'
-- ============================================================
ALTER TABLE notifications
  DROP CONSTRAINT notifications_type_check,
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('budget_alert', 'cc_reminder', 'large_transaction', 'goal_milestone'));


-- ============================================================
-- RPC Function: add_goal_contribution
-- ============================================================
-- Atomically inserts a contribution and updates goal current_amount.
-- Auto-completes goal when current_amount >= target_amount.
-- Creates milestone notifications at 25%, 50%, 75%, 100%.
-- Requirements: 3.3, 3.4, 8.1, 8.2, 8.3, 8.4, 8.5, 10.4
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_goal_contribution(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL
)
RETURNS goal_contributions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_goal financial_goals;
  v_contribution goal_contributions;
  v_old_amount BIGINT;
  v_new_amount BIGINT;
  v_old_progress BIGINT;
  v_new_progress BIGINT;
  v_milestone INT;
  v_milestones INT[] := ARRAY[25, 50, 75, 100];
BEGIN
  -- Validate caller owns this data
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Fetch the goal and validate ownership + status
  SELECT * INTO v_goal
  FROM financial_goals
  WHERE id = p_goal_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status <> 'active' THEN
    RAISE EXCEPTION 'Goal is not active';
  END IF;

  -- Store old amount for milestone calculation
  v_old_amount := v_goal.current_amount;
  v_new_amount := v_old_amount + p_amount;

  -- Insert the contribution row
  INSERT INTO goal_contributions (goal_id, user_id, amount, note)
  VALUES (p_goal_id, p_user_id, p_amount, p_note)
  RETURNING * INTO v_contribution;

  -- Update current_amount on the goal
  UPDATE financial_goals
  SET current_amount = v_new_amount,
      updated_at = now()
  WHERE id = p_goal_id AND user_id = p_user_id;

  -- Auto-complete goal when current_amount >= target_amount
  IF v_new_amount >= v_goal.target_amount THEN
    UPDATE financial_goals
    SET status = 'completed',
        updated_at = now()
    WHERE id = p_goal_id AND user_id = p_user_id;
  END IF;

  -- Check and create milestone notifications
  v_old_progress := (v_old_amount * 100) / v_goal.target_amount;
  v_new_progress := (v_new_amount * 100) / v_goal.target_amount;

  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_new_progress >= v_milestone AND v_old_progress < v_milestone THEN
      INSERT INTO notifications (user_id, type, message, deduplication_key)
      VALUES (
        p_user_id,
        'goal_milestone',
        CASE v_milestone
          WHEN 100 THEN 'Selamat! Goal "' || v_goal.name || '" telah tercapai! 🎉'
          ELSE 'Goal "' || v_goal.name || '" sudah mencapai ' || v_milestone || '%!'
        END,
        'goal_milestone:' || p_goal_id || ':' || v_milestone
      )
      ON CONFLICT (user_id, deduplication_key) WHERE deduplication_key IS NOT NULL
      DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_contribution;
END;
$fn$;


-- ============================================================
-- RPC Function: withdraw_goal_contribution
-- ============================================================
-- Atomically inserts a negative contribution and updates goal current_amount.
-- Reverts status from 'completed' to 'active' when current_amount drops below target_amount.
-- Requirements: 4.3, 4.4, 10.4
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION withdraw_goal_contribution(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL
)
RETURNS goal_contributions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_goal financial_goals;
  v_contribution goal_contributions;
  v_new_amount BIGINT;
BEGIN
  -- Validate caller owns this data
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Fetch the goal and validate ownership + status
  SELECT * INTO v_goal
  FROM financial_goals
  WHERE id = p_goal_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_goal.status NOT IN ('active', 'completed') THEN
    RAISE EXCEPTION 'Goal is not active or completed';
  END IF;

  -- Validate withdrawal does not exceed current amount
  IF p_amount > v_goal.current_amount THEN
    RAISE EXCEPTION 'Withdrawal amount exceeds current goal balance';
  END IF;

  -- Calculate new amount
  v_new_amount := v_goal.current_amount - p_amount;

  -- Insert the contribution row with negative amount
  INSERT INTO goal_contributions (goal_id, user_id, amount, note)
  VALUES (p_goal_id, p_user_id, -p_amount, p_note)
  RETURNING * INTO v_contribution;

  -- Update current_amount on the goal
  UPDATE financial_goals
  SET current_amount = v_new_amount,
      updated_at = now()
  WHERE id = p_goal_id AND user_id = p_user_id;

  -- Revert status from 'completed' to 'active' when current_amount drops below target_amount
  IF v_goal.status = 'completed' AND v_new_amount < v_goal.target_amount THEN
    UPDATE financial_goals
    SET status = 'active',
        updated_at = now()
    WHERE id = p_goal_id AND user_id = p_user_id;
  END IF;

  RETURN v_contribution;
END;
$fn$;
