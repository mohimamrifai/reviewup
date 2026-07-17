-- ============================================================
-- Seed Data: ReviewUp
-- ============================================================
-- 1 super admin, 1 leader, 1 staff, 2 members.
-- Semua password: Reviewup@123
--
-- Catatan penting:
--   • Trigger `on_auth_user_created` otomatis INSERT ke public.profiles
--     setiap kali INSERT ke auth.users. Seed ini hanya INSERT ke
--     auth.users + auth.identities, lalu UPDATE profiles untuk field
--     tambahan (leader_id, balance, level).
--   • File ini TRUNCATE semua data. Jangan dijalankan di production.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Bersihkan semua data (child → parent)
-- ============================================================
TRUNCATE TABLE
  public.audit_logs,
  public.bank_accounts,
  public.deposits,
  public.withdrawals,
  public.tasks,
  public.products,
  public.deposit_bank_accounts,
  public.commission_settings
RESTART IDENTITY CASCADE;

DELETE FROM public.profiles;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- ============================================================
-- 2. Insert users (auth.users + auth.identities)
-- ============================================================
-- Trigger `on_auth_user_created` akan auto-insert ke public.profiles
-- berdasarkan raw_user_meta_data. Setelahnya, kita UPDATE profiles
-- untuk set field yang trigger tidak tangani (leader_id, balance, dll).
-- ============================================================

-- ===== SUPER ADMIN =====
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated',
  'superadmin@reviewup.app',
  crypt('Reviewup@123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', 'superadmin', 'role', 'super_admin'),
  false, now(), now()
);
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111', 'email',
  jsonb_build_object('sub', '11111111-1111-4111-8111-111111111111', 'email', 'superadmin@reviewup.app', 'email_verified', true),
  now(), now(), now()
);

-- ===== ADMIN LEADER =====
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-4222-8222-222222222222',
  'authenticated', 'authenticated',
  'adminleader@reviewup.app',
  crypt('Reviewup@123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', 'adminleader', 'role', 'admin_leader'),
  false, now(), now()
);
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222222', 'email',
  jsonb_build_object('sub', '22222222-2222-4222-8222-222222222222', 'email', 'adminleader@reviewup.app', 'email_verified', true),
  now(), now(), now()
);

-- ===== ADMIN STAFF (di bawah adminleader) =====
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-4333-8333-333333333333',
  'authenticated', 'authenticated',
  'adminstaff@reviewup.app',
  crypt('Reviewup@123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'adminstaff',
    'role', 'admin_staff',
    'leader_id', '22222222-2222-4222-8222-222222222222',
    'referral_code', 'STAFF-DEMO01'
  ),
  false, now(), now()
);
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '33333333-3333-4333-8333-333333333333',
  '33333333-3333-4333-8333-333333333333', 'email',
  jsonb_build_object('sub', '33333333-3333-4333-8333-333333333333', 'email', 'adminstaff@reviewup.app', 'email_verified', true),
  now(), now(), now()
);

-- ===== MEMBER 1 (rina, referred by adminstaff) =====
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '44444444-4444-4444-8444-444444444444',
  'authenticated', 'authenticated',
  'rina@reviewup.app',
  crypt('Reviewup@123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'rina',
    'role', 'member',
    'referred_by', 'STAFF-DEMO01'
  ),
  false, now(), now()
);
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '44444444-4444-4444-8444-444444444444',
  '44444444-4444-4444-8444-444444444444', 'email',
  jsonb_build_object('sub', '44444444-4444-4444-8444-444444444444', 'email', 'rina@reviewup.app', 'email_verified', true),
  now(), now(), now()
);

-- ===== MEMBER 2 (budi, referred by adminstaff) =====
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '55555555-4555-4555-8555-555555555555',
  'authenticated', 'authenticated',
  'budi@reviewup.app',
  crypt('Reviewup@123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'budi',
    'role', 'member',
    'referred_by', 'STAFF-DEMO01'
  ),
  false, now(), now()
);
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '55555555-4555-4555-8555-555555555555',
  '55555555-4555-4555-8555-555555555555', 'email',
  jsonb_build_object('sub', '55555555-4555-4555-8555-555555555555', 'email', 'budi@reviewup.app', 'email_verified', true),
  now(), now(), now()
);

-- ============================================================
-- 3. Update profiles untuk field tambahan
-- ============================================================
-- Trigger `handle_new_user()` sudah insert profiles dengan field dari
-- raw_user_meta_data (username, role, referral_code untuk admin,
-- referred_by untuk member). Sekarang lengkapi field lain.

UPDATE public.profiles SET
  level = 'classic',
  credit_score = 100,
  balance = 0,
  status = 'online',
  updated_at = now()
WHERE id = '11111111-1111-4111-8111-111111111111';

UPDATE public.profiles SET
  level = 'classic',
  credit_score = 100,
  balance = 0,
  status = 'online',
  updated_at = now()
WHERE id = '22222222-2222-4222-8222-222222222222';

-- Staff: set leader_id (trigger tidak handle ini)
UPDATE public.profiles SET
  level = 'classic',
  credit_score = 100,
  balance = 0,
  status = 'online',
  leader_id = '22222222-2222-4222-8222-222222222222',
  updated_at = now()
WHERE id = '33333333-3333-4333-8333-333333333333';

-- Member rina: balance awal 500.000
UPDATE public.profiles SET
  level = 'classic',
  credit_score = 100,
  balance = 500000,
  status = 'online',
  updated_at = now()
WHERE id = '44444444-4444-4444-8444-444444444444';

-- Member budi: balance awal 300.000
UPDATE public.profiles SET
  level = 'classic',
  credit_score = 100,
  balance = 300000,
  status = 'online',
  updated_at = now()
WHERE id = '55555555-4555-4555-8555-555555555555';

-- ============================================================
-- 4. Seed commission_settings (idempotent)
-- ============================================================
INSERT INTO public.commission_settings (level, percent) VALUES
  ('classic', 20),
  ('silver', 25),
  ('gold', 30),
  ('platinum', 35),
  ('diamond', 40),
  ('premier', 50)
ON CONFLICT (level) DO UPDATE SET percent = EXCLUDED.percent;

-- ============================================================
-- 5. Verifikasi
-- ============================================================
SELECT id, username, role, level, balance, status, leader_id, referral_code
FROM public.profiles
ORDER BY
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin_leader' THEN 2
    WHEN 'admin_staff' THEN 3
    WHEN 'member' THEN 4
  END,
  username;

COMMIT;
