-- Fix: pgcrypto functions (crypt, gen_salt) ada di schema "extensions" di
-- Supabase, bukan di "public". Trigger dengan SET search_path TO 'public'
-- tidak bisa lihat fungsi-fungsi itu, jadi register gagal dengan "function
-- gen_salt(unknown, integer) does not exist" → Supabase Auth HTTP 500.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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

  -- Hash withdraw password dengan bcrypt (panggil dari schema "extensions"
  -- karena di Supabase pgcrypto terinstall di sana, bukan di "public").
  IF v_withdraw_pw IS NOT NULL THEN
    v_withdraw_hash := extensions.crypt(v_withdraw_pw, extensions.gen_salt('bf', 10));
  END IF;

  -- Auto-generate referral_code untuk admin_staff/admin_leader yang belum punya
  IF v_role IN ('admin_staff', 'admin_leader') AND v_referral_code IS NULL THEN
    v_referral_code := public.generate_referral_code();
  END IF;

  -- Resolve referred_by (staff id) jika referral_code diberikan saat register
  IF v_referral_code IS NOT NULL AND v_role = 'member' THEN
    SELECT id INTO v_staff_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
      AND role IN ('admin_staff', 'admin_leader')
    LIMIT 1;
  END IF;

  -- Untuk member, referral_code di profile mereka sendiri harus NULL agar
  -- tidak konflik dengan unique index yang sudah dipakai admin staff/leader.
  INSERT INTO public.profiles (
    id, username, role, balance, referred_by, withdraw_password_hash, referral_code
  )
  VALUES (
    NEW.id,
    v_username,
    v_role::user_role,
    v_balance,
    v_staff_id,
    v_withdraw_hash,
    CASE WHEN v_role = 'member' THEN NULL ELSE v_referral_code END
  )
  ON CONFLICT (id) DO UPDATE SET
    withdraw_password_hash = COALESCE(EXCLUDED.withdraw_password_hash, profiles.withdraw_password_hash),
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code);

  RETURN NEW;
END;
$$;
