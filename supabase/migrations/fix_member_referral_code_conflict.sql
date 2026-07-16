-- Fix: handle_new_user() tidak boleh set referral_code member = kode undangan
-- yang diinput user, karena kolom referral_code UNIQUE dan kode itu sudah
-- dipakai admin_staff/admin_leader. Untuk member, referral_code di profile
-- mereka harus NULL (kolom referred_by sudah cukup untuk menunjuk ke staff).
--
-- Sebelumnya: INSERT ke profiles dengan referral_code = v_referral_code → 23505
-- (unique_violation) → trigger error → auth.users INSERT gagal → Supabase
-- mengembalikan HTTP 500 dengan body kosong "{}" ke client.

-- Pastikan generate_referral_code() ada (dipakai untuk admin_staff/admin_leader
-- yang dibuat via signUp tanpa referral_code di metadata).
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate text;
  v_exists boolean;
BEGIN
  LOOP
    v_candidate := 'STAFF-' || upper(substring(md5(random()::text) for 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_candidate) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_candidate;
END;
$$;

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

  -- PENTING: untuk member, referral_code di profile mereka sendiri harus NULL.
  -- Hanya staff/leader yang boleh punya referral_code (untuk di-share ke member
  -- baru). Kalau di-set, akan konflik dengan unique index yang sudah dipakai staff.
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
