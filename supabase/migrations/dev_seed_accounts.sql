-- ============================================================
-- ReviewUp - Seed Development (Easy & Idempotent)
-- ============================================================
-- Versi migration: file ini di-apply via supabase_apply_migration.
-- Versi portabel ada di supabase/seed.sql.
--
-- Daftar akun (samakan dengan tasks.md):
--   ┌─────────────┬────────────────┬──────────────────────────────────┐
--   │ Username    │ Password       │ Keterangan                       │
--   ├─────────────┼────────────────┼──────────────────────────────────┤
--   │ superadmin  │ Reviewup@123   │ Akses /admin/dashboard           │
--   │ adminleader │ Reviewup@123   │ Akses /admin/dashboard           │
--   │ adminstaff  │ Reviewup@123   │ Referral STAFF001, di-leader-kan │
--   │ member      │ Reviewup@123   │ Saldo awal Rp30.000              │
--   │ rinasyah    │ jika123        │ Referral STAFF001, tarik: 123456 │
--   └─────────────┴────────────────┴──────────────────────────────────┘
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Helper: insert user + identity kalau email belum ada
-- ============================================================
CREATE OR REPLACE FUNCTION public._seed_user(
  p_email text,
  p_password text,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  v_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin,
    created_at, updated_at,
    confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated', 'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    p_metadata,
    false,
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_id,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
    'email', p_email,
    now(), now(), now()
  );

  RETURN v_id;
END;
$$;

-- ============================================================
-- 2. Seed 5 akun (urutan penting: leader sebelum staff)
-- ============================================================
DO $$
DECLARE
  v_superadmin_id  uuid;
  v_adminleader_id uuid;
  v_adminstaff_id  uuid;
  v_member_id      uuid;
  v_rinasyah_id    uuid;
BEGIN
  v_superadmin_id := public._seed_user(
    'superadmin@reviewup.app',
    'Reviewup@123',
    '{"username":"superadmin","role":"super_admin"}'::jsonb
  );

  v_adminleader_id := public._seed_user(
    'adminleader@reviewup.app',
    'Reviewup@123',
    '{"username":"adminleader","role":"admin_leader"}'::jsonb
  );

  v_adminstaff_id := public._seed_user(
    'adminstaff@reviewup.app',
    'Reviewup@123',
    jsonb_build_object(
      'username', 'adminstaff',
      'role', 'admin_staff',
      'referral_code', 'STAFF001',
      'leader_id', v_adminleader_id::text
    )
  );

  v_member_id := public._seed_user(
    'member@reviewup.app',
    'Reviewup@123',
    '{"username":"member","role":"member"}'::jsonb
  );

  v_rinasyah_id := public._seed_user(
    'rinasyah@reviewup.app',
    'jika123',
    jsonb_build_object(
      'username', 'rinasyah',
      'role', 'member',
      'referral_code', 'STAFF001',
      'withdraw_password_hash', '123456'
    )
  );

  -- Admin staff: referral_code = STAFF001, leader_id = adminleader
  UPDATE public.profiles
  SET referral_code = 'STAFF001',
      leader_id     = v_adminleader_id,
      status        = 'online',
      balance       = 0,
      updated_at    = now()
  WHERE id = v_adminstaff_id;

  -- Member: saldo awal 30.000
  UPDATE public.profiles
  SET balance    = 30000,
      status     = 'online',
      updated_at = now()
  WHERE id = v_member_id;

  -- Rinasyah: referred_by → adminstaff, sandi penarikan sudah di-hash trigger
  UPDATE public.profiles
  SET referred_by = v_adminstaff_id,
      balance     = 30000,
      status      = 'online',
      updated_at  = now()
  WHERE id = v_rinasyah_id;
END $$;

-- ============================================================
-- 3. Verifikasi
-- ============================================================
SELECT
  username,
  role,
  balance,
  status,
  referral_code,
  referred_by,
  leader_id
FROM public.profiles
ORDER BY
  CASE role
    WHEN 'super_admin'  THEN 1
    WHEN 'admin_leader' THEN 2
    WHEN 'admin_staff'  THEN 3
    WHEN 'member'       THEN 4
  END,
  username;
