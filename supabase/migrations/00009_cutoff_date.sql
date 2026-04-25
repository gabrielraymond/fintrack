-- Add cutoff_date column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN cutoff_date INTEGER NOT NULL DEFAULT 1
    CHECK (cutoff_date >= 1 AND cutoff_date <= 28);
