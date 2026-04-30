-- ============================================================
-- FinTrack Gold/Precious Metal Assets — Schema Migration
-- ============================================================
-- 1. Adds 'gold' to accounts type constraint
-- 2. Adds gold_brand and gold_weight_grams columns
-- Requirements: Gold asset tracking with brand (antam, galeri24)

-- ------------------------------------------------------------
-- 1. Update accounts type constraint to include 'gold'
-- ------------------------------------------------------------
ALTER TABLE accounts
  DROP CONSTRAINT accounts_type_check,
  ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('bank', 'e-wallet', 'cash', 'credit_card', 'investment', 'tabungan', 'dana_darurat', 'gold'));

-- ------------------------------------------------------------
-- 2. Add gold-specific columns
-- ------------------------------------------------------------
ALTER TABLE accounts
  ADD COLUMN gold_brand TEXT CHECK (gold_brand IN ('antam', 'galeri24')),
  ADD COLUMN gold_weight_grams NUMERIC(10, 4);

-- Add constraint: gold accounts must have brand and weight
-- Non-gold accounts should not have these fields
ALTER TABLE accounts
  ADD CONSTRAINT gold_fields_check
    CHECK (
      (type = 'gold' AND gold_brand IS NOT NULL AND gold_weight_grams IS NOT NULL AND gold_weight_grams > 0)
      OR
      (type <> 'gold' AND gold_brand IS NULL AND gold_weight_grams IS NULL)
    );

-- Index for gold accounts
CREATE INDEX idx_accounts_gold ON accounts(user_id, type) WHERE type = 'gold' AND is_deleted = false;
