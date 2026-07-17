-- Update handle_new_user(): baca `leader_id` dari raw_user_meta_data
-- saat membuat admin_staff, sehingga relasi leader-staff ter-record otomatis.

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
  v_leader_id text;
  v_staff_id uuid;
  v_balance numeric(15, 2);
  v_withdraw_pw text;
  v_withdraw_hash text;
BEGIN
  v_username := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substr(NEW.id::text, 1, 8));
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'member');
  v_referral_code := NULLIF(NEW.raw_user_meta_data->>'referral_code', '');
  v_leader_id := NULLIF(NEW.raw_user_meta_data->>'leader_id', '');
  v_withdraw_pw := NULLIF(NEW.raw_user_meta_data->>'withdraw_password_hash', '');
  v_balance := CASE WHEN v_role = 'member' THEN 30000 ELSE 0 END;

  -- Hash withdraw password dengan bcrypt
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

  INSERT INTO public.profiles (id, username, role, balance, referred_by, withdraw_password_hash, referral_code, leader_id)
  VALUES (
    NEW.id,
    v_username,
    v_role::user_role,
    v_balance,
    v_staff_id,
    v_withdraw_hash,
    v_referral_code,
    CASE
      WHEN v_role = 'admin_staff' AND v_leader_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = v_leader_id::uuid AND role = 'admin_leader')
      THEN v_leader_id::uuid
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    withdraw_password_hash = COALESCE(EXCLUDED.withdraw_password_hash, profiles.withdraw_password_hash),
    referral_code = COALESCE(profiles.referral_code, EXCLUDED.referral_code),
    leader_id = COALESCE(EXCLUDED.leader_id, profiles.leader_id);

  RETURN NEW;
END;
$$;
