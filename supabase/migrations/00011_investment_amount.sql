-- ============================================================
-- FinTrack Investment P/L Tracking — Schema Migration
-- ============================================================
-- Adds invested_amount column to accounts table for tracking
-- total capital invested in investment accounts.
-- Requirements: 1.1, 6.3

-- ------------------------------------------------------------
-- 1. Add invested_amount column (nullable BIGINT)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'invested_amount'
  ) THEN
    ALTER TABLE accounts ADD COLUMN invested_amount BIGINT;
  END IF;
END $$;
