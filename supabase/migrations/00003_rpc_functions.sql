-- ============================================================
-- FinTrack Personal Finance — RPC Functions for Atomic Balance Operations
-- ============================================================
-- Creates database functions that ensure transaction creation,
-- update, and deletion atomically modify account balances.
-- Requirements: 4.5, 4.6, 4.7, 6.1, 6.2, 6.3, 6.4

-- ------------------------------------------------------------
-- 1. create_transaction
-- ------------------------------------------------------------
-- Inserts a transaction row and updates account balance(s) atomically.
-- Balance logic:
--   expense:  account.balance -= amount
--   income:   account.balance += amount
--   transfer: source.balance -= amount, dest.balance += amount
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_transaction(
  p_user_id UUID,
  p_account_id UUID,
  p_destination_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT 'expense',
  p_amount BIGINT DEFAULT 0,
  p_note TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_transaction transactions;
BEGIN
  -- Validate caller owns this data
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch';
  END IF;

  -- Validate type
  IF p_type NOT IN ('income', 'expense', 'transfer') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Validate transfer has destination
  IF p_type = 'transfer' AND p_destination_account_id IS NULL THEN
    RAISE EXCEPTION 'Transfer requires a destination account';
  END IF;

  -- Insert the transaction row
  INSERT INTO transactions (user_id, account_id, destination_account_id, category_id, type, amount, note, date)
  VALUES (p_user_id, p_account_id, p_destination_account_id, p_category_id, p_type, p_amount, p_note, p_date)
  RETURNING * INTO v_transaction;

  -- Update account balance(s) based on type
  IF p_type = 'expense' THEN
    UPDATE accounts SET balance = balance - p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;

  ELSIF p_type = 'income' THEN
    UPDATE accounts SET balance = balance + p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;

  ELSIF p_type = 'transfer' THEN
    -- Deduct from source
    UPDATE accounts SET balance = balance - p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    -- Add to destination
    UPDATE accounts SET balance = balance + p_amount, updated_at = now()
    WHERE id = p_destination_account_id AND user_id = p_user_id;
  END IF;

  RETURN v_transaction;
END;
$fn$;

-- ------------------------------------------------------------
-- 2. update_transaction
-- ------------------------------------------------------------
-- Fetches the old transaction, reverses its balance effect,
-- applies the new balance effect, and updates the row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_transaction(
  p_transaction_id UUID,
  p_user_id UUID,
  p_account_id UUID,
  p_destination_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT 'expense',
  p_amount BIGINT DEFAULT 0,
  p_note TEXT DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_old transactions;
  v_updated transactions;
BEGIN
  -- Validate caller owns this data
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch';
  END IF;

  -- Validate type
  IF p_type NOT IN ('income', 'expense', 'transfer') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_type;
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Validate transfer has destination
  IF p_type = 'transfer' AND p_destination_account_id IS NULL THEN
    RAISE EXCEPTION 'Transfer requires a destination account';
  END IF;

  -- Fetch the old transaction
  SELECT * INTO v_old FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Step 1: Reverse the old balance effect
  IF v_old.type = 'expense' THEN
    UPDATE accounts SET balance = balance + v_old.amount, updated_at = now()
    WHERE id = v_old.account_id AND user_id = p_user_id;

  ELSIF v_old.type = 'income' THEN
    UPDATE accounts SET balance = balance - v_old.amount, updated_at = now()
    WHERE id = v_old.account_id AND user_id = p_user_id;

  ELSIF v_old.type = 'transfer' THEN
    -- Reverse source deduction
    UPDATE accounts SET balance = balance + v_old.amount, updated_at = now()
    WHERE id = v_old.account_id AND user_id = p_user_id;
    -- Reverse destination addition
    UPDATE accounts SET balance = balance - v_old.amount, updated_at = now()
    WHERE id = v_old.destination_account_id AND user_id = p_user_id;
  END IF;

  -- Step 2: Apply the new balance effect
  IF p_type = 'expense' THEN
    UPDATE accounts SET balance = balance - p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;

  ELSIF p_type = 'income' THEN
    UPDATE accounts SET balance = balance + p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;

  ELSIF p_type = 'transfer' THEN
    UPDATE accounts SET balance = balance - p_amount, updated_at = now()
    WHERE id = p_account_id AND user_id = p_user_id;
    UPDATE accounts SET balance = balance + p_amount, updated_at = now()
    WHERE id = p_destination_account_id AND user_id = p_user_id;
  END IF;

  -- Step 3: Update the transaction row
  UPDATE transactions
  SET account_id = p_account_id,
      destination_account_id = p_destination_account_id,
      category_id = p_category_id,
      type = p_type,
      amount = p_amount,
      note = p_note,
      date = p_date,
      updated_at = now()
  WHERE id = p_transaction_id AND user_id = p_user_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$fn$;

-- ------------------------------------------------------------
-- 3. delete_transaction
-- ------------------------------------------------------------
-- Fetches the transaction, reverses its balance effect,
-- and deletes the row.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_transaction(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_transaction transactions;
BEGIN
  -- Validate caller owns this data
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user mismatch';
  END IF;

  -- Fetch the transaction
  SELECT * INTO v_transaction FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Reverse the balance effect
  IF v_transaction.type = 'expense' THEN
    UPDATE accounts SET balance = balance + v_transaction.amount, updated_at = now()
    WHERE id = v_transaction.account_id AND user_id = p_user_id;

  ELSIF v_transaction.type = 'income' THEN
    UPDATE accounts SET balance = balance - v_transaction.amount, updated_at = now()
    WHERE id = v_transaction.account_id AND user_id = p_user_id;

  ELSIF v_transaction.type = 'transfer' THEN
    -- Reverse source deduction
    UPDATE accounts SET balance = balance + v_transaction.amount, updated_at = now()
    WHERE id = v_transaction.account_id AND user_id = p_user_id;
    -- Reverse destination addition
    UPDATE accounts SET balance = balance - v_transaction.amount, updated_at = now()
    WHERE id = v_transaction.destination_account_id AND user_id = p_user_id;
  END IF;

  -- Delete the transaction row
  DELETE FROM transactions
  WHERE id = p_transaction_id AND user_id = p_user_id;

  RETURN v_transaction;
END;
$fn$;
