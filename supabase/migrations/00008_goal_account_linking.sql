-- ============================================================
-- FinTrack Goal-Account Linking — Schema Migration
-- ============================================================
-- 1. Adds nullable account_id column to goal_contributions
-- 2. Creates index on goal_contributions(account_id)
-- 3. Updates add_goal_contribution RPC with account linking
-- 4. Updates withdraw_goal_contribution RPC with account linking
-- Requirements: 2.1–2.5, 4.1–4.5, 5.1, 7.1, 7.3, 7.4

-- ------------------------------------------------------------
-- 1. Add account_id column to goal_contributions
-- ------------------------------------------------------------
ALTER TABLE goal_contributions
  ADD COLUMN account_id UUID REFERENCES accounts(id);

CREATE INDEX idx_goal_contributions_account ON goal_contributions(account_id);

-- ============================================================
-- 2. Updated RPC: add_goal_contribution (with account linking)
-- ============================================================
-- Adds p_account_id parameter. When provided:
--   - Validates account ownership, active status, sufficient balance
--   - Atomically decreases account balance
-- Stores account_id on the contribution row.
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.3
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_goal_contribution(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL,
  p_account_id UUID DEFAULT NULL
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
  v_account accounts;
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

  -- Account linking: validate and deduct balance
  IF p_account_id IS NOT NULL THEN
    SELECT * INTO v_account
    FROM accounts
    WHERE id = p_account_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found';
    END IF;

    IF v_account.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Account does not belong to user';
    END IF;

    IF v_account.is_deleted = true THEN
      RAISE EXCEPTION 'Account is not active';
    END IF;

    IF v_account.balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient account balance';
    END IF;

    UPDATE accounts
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
  END IF;

  -- Store old amount for milestone calculation
  v_old_amount := v_goal.current_amount;
  v_new_amount := v_old_amount + p_amount;

  -- Insert the contribution row with account_id
  INSERT INTO goal_contributions (goal_id, user_id, amount, note, account_id)
  VALUES (p_goal_id, p_user_id, p_amount, p_note, p_account_id)
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
-- 3. Updated RPC: withdraw_goal_contribution (with account linking)
-- ============================================================
-- Adds p_account_id parameter. When provided:
--   - Validates account ownership, active status
--   - Atomically increases account balance
-- Stores account_id on the contribution row.
-- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION withdraw_goal_contribution(
  p_user_id UUID,
  p_goal_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL,
  p_account_id UUID DEFAULT NULL
)
RETURNS goal_contributions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_goal financial_goals;
  v_contribution goal_contributions;
  v_new_amount BIGINT;
  v_account accounts;
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

  -- Account linking: validate and increase balance
  IF p_account_id IS NOT NULL THEN
    SELECT * INTO v_account
    FROM accounts
    WHERE id = p_account_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found';
    END IF;

    IF v_account.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Account does not belong to user';
    END IF;

    IF v_account.is_deleted = true THEN
      RAISE EXCEPTION 'Account is not active';
    END IF;

    UPDATE accounts
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
  END IF;

  -- Calculate new amount
  v_new_amount := v_goal.current_amount - p_amount;

  -- Insert the contribution row with negative amount and account_id
  INSERT INTO goal_contributions (goal_id, user_id, amount, note, account_id)
  VALUES (p_goal_id, p_user_id, -p_amount, p_note, p_account_id)
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
