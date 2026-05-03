-- ============================================================
-- FinTrack Recurring Budget — Schema Migration
-- ============================================================
-- Adds is_recurring column to budgets table for marking
-- budgets that should be automatically carried over to the
-- next period.
-- Requirements: 1.1, 1.2, 1.3

-- ------------------------------------------------------------
-- 1. Add is_recurring column (BOOLEAN, NOT NULL, DEFAULT FALSE)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE budgets ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;
