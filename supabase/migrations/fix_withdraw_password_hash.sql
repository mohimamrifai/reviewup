-- Fix: store withdraw password hash saat register
-- Sebelumnya trigger tidak insert withdraw_password_hash dari metadata

-- Pastikan extension pgcrypto tersedia (untuk crypt() bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_role text;
  v_referral_code text;
  v_staff_id uuid;
  v_balance numeric(15, 2);
  v_withdraw_pw text;
  v_withdraw_hash text;
BEGIN
  v_username := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substr(NEW.id::text, 1, 8));
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'member');
  v_referral_code := NULLIF(NEW.raw_user_meta_data->>'referral_code', '');
  v_withdraw_pw := NULLIF(NEW.raw_user_meta_data->>'withdraw_password_hash', '');
  v_balance := CASE WHEN v_role = 'member' THEN 30000 ELSE 0 END;

  -- Hash withdraw password dengan bcrypt
  IF v_withdraw_pw IS NOT NULL THEN
    v_withdraw_hash := crypt(v_withdraw_pw, gen_salt('bf', 10));
  END IF;

  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_staff_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
      AND role IN ('admin_staff', 'admin_leader')
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, role, balance, referred_by, withdraw_password_hash)
  VALUES (
    NEW.id,
    v_username,
    v_role::user_role,
    v_balance,
    v_staff_id,
    v_withdraw_hash
  )
  ON CONFLICT (id) DO UPDATE SET
    withdraw_password_hash = COALESCE(EXCLUDED.withdraw_password_hash, profiles.withdraw_password_hash);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
