-- ============================================================
-- FinTrack — Delete User Account (full reset)
-- ============================================================
-- Deletes all user data and removes the user from auth.users
-- so they must re-register to use the app again.
-- Uses SECURITY DEFINER to access auth.users.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all user data in order (respecting foreign keys)
  DELETE FROM transaction_presets WHERE user_id = v_user_id;
  DELETE FROM budgets WHERE user_id = v_user_id;
  DELETE FROM transactions WHERE user_id = v_user_id;
  DELETE FROM categories WHERE user_id = v_user_id;
  DELETE FROM accounts WHERE user_id = v_user_id;
  DELETE FROM user_profiles WHERE id = v_user_id;

  -- Delete the user from auth.users (this fully removes the account)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$fn$;
