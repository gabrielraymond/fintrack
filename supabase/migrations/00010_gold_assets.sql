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
  DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE accounts
  ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('bank', 'e-wallet', 'cash', 'credit_card', 'investment', 'tabungan', 'dana_darurat', 'gold'));

-- ------------------------------------------------------------
-- 2. Add gold-specific columns (IF NOT EXISTS)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'gold_brand'
  ) THEN
    ALTER TABLE accounts ADD COLUMN gold_brand TEXT CHECK (gold_brand IN ('antam', 'galeri24'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'gold_weight_grams'
  ) THEN
    ALTER TABLE accounts ADD COLUMN gold_weight_grams NUMERIC(10, 4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'gold_purchase_price_per_gram'
  ) THEN
    ALTER TABLE accounts ADD COLUMN gold_purchase_price_per_gram BIGINT;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Clean up existing data to satisfy constraint
--    - Non-gold accounts: ensure gold fields are NULL
--    - Gold accounts without purchase price: set a default
-- ------------------------------------------------------------
UPDATE accounts
SET gold_brand = NULL,
    gold_weight_grams = NULL,
    gold_purchase_price_per_gram = NULL
WHERE type <> 'gold';

UPDATE accounts
SET gold_purchase_price_per_gram = 0
WHERE type = 'gold' AND gold_purchase_price_per_gram IS NULL;

-- Remove any gold accounts that would still violate (missing brand/weight)
-- by converting them back to 'investment' type
UPDATE accounts
SET type = 'investment',
    gold_brand = NULL,
    gold_weight_grams = NULL,
    gold_purchase_price_per_gram = NULL
WHERE type = 'gold' AND (gold_brand IS NULL OR gold_weight_grams IS NULL OR gold_weight_grams <= 0 OR gold_purchase_price_per_gram IS NULL OR gold_purchase_price_per_gram <= 0);

-- ------------------------------------------------------------
-- 4. Add/replace constraint for gold fields validation
-- ------------------------------------------------------------
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS gold_fields_check;

ALTER TABLE accounts
  ADD CONSTRAINT gold_fields_check
    CHECK (
      (type = 'gold' AND gold_brand IS NOT NULL AND gold_weight_grams IS NOT NULL AND gold_weight_grams > 0 AND gold_purchase_price_per_gram IS NOT NULL AND gold_purchase_price_per_gram > 0)
      OR
      (type <> 'gold' AND gold_brand IS NULL AND gold_weight_grams IS NULL AND gold_purchase_price_per_gram IS NULL)
    );

-- ------------------------------------------------------------
-- 5. Index for gold accounts
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accounts_gold ON accounts(user_id, type) WHERE type = 'gold' AND is_deleted = false;
