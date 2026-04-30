-- ============================================================
-- FinTrack Gold/Precious Metal Assets — Schema Migration
-- ============================================================
-- 1. Adds 'gold' to accounts type constraint
-- 2. Adds gold_brand, gold_weight_grams, gold_purchase_price_per_gram columns
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
  ADD COLUMN gold_weight_grams NUMERIC(10, 4),
  ADD COLUMN gold_purchase_price_per_gram BIGINT;

-- Add constraint: gold accounts must have brand, weight, and purchase price
-- Non-gold accounts should not have these fields
ALTER TABLE accounts
  ADD CONSTRAINT gold_fields_check
    CHECK (
      (type = 'gold' AND gold_brand IS NOT NULL AND gold_weight_grams IS NOT NULL AND gold_weight_grams > 0 AND gold_purchase_price_per_gram IS NOT NULL AND gold_purchase_price_per_gram > 0)
      OR
      (type <> 'gold' AND gold_brand IS NULL AND gold_weight_grams IS NULL AND gold_purchase_price_per_gram IS NULL)
    );

-- Index for gold accounts
CREATE INDEX idx_accounts_gold ON accounts(user_id, type) WHERE type = 'gold' AND is_deleted = false;
