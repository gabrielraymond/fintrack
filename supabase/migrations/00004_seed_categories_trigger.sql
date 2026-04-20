-- ============================================================
-- FinTrack Personal Finance — Auto-create profile & seed categories
-- ============================================================
-- Creates a trigger on auth.users that:
-- 1. Creates a user_profiles row
-- 2. Seeds default Indonesian categories
-- Uses SECURITY DEFINER to bypass RLS.
-- Requirements: 2.3, 15.1

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (id, display_name, onboarding_completed)
  VALUES (NEW.id, NULL, false)
  ON CONFLICT (id) DO NOTHING;

  -- Seed default categories
  INSERT INTO public.categories (user_id, name, icon, is_default)
  VALUES
    (NEW.id, 'Makan',      '🍔', true),
    (NEW.id, 'Transport',   '🚗', true),
    (NEW.id, 'Kost/Sewa',   '🏠', true),
    (NEW.id, 'Belanja',     '🛒', true),
    (NEW.id, 'Hiburan',     '🎬', true),
    (NEW.id, 'Kesehatan',   '💊', true),
    (NEW.id, 'Pendidikan',  '📚', true),
    (NEW.id, 'Tagihan',     '📄', true),
    (NEW.id, 'Gaji',        '💰', true),
    (NEW.id, 'Investasi',   '📈', true),
    (NEW.id, 'Lainnya',     '📦', true);

  RETURN NEW;
END;
$$;

-- Trigger on auth.users AFTER INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
