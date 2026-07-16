-- Seed 4 akun (1 per role) untuk development.
-- Password untuk semua: Reviewup@123
-- Login pakai username (form akan auto-tambahkan @reviewup.local).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Super Admin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'superadmin@reviewup.local',
  crypt('Reviewup@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"superadmin","role":"super_admin"}'::jsonb,
  now(), now(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'superadmin@reviewup.local'
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at,
  created_at, updated_at
)
SELECT
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.email, now(), now(), now()
FROM auth.users u
WHERE u.email = 'superadmin@reviewup.local'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE provider_id = u.email
  );

-- Admin Leader
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'adminleader@reviewup.local',
  crypt('Reviewup@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"adminleader","role":"admin_leader"}'::jsonb,
  now(), now(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'adminleader@reviewup.local'
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at,
  created_at, updated_at
)
SELECT
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.email, now(), now(), now()
FROM auth.users u
WHERE u.email = 'adminleader@reviewup.local'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE provider_id = u.email
  );

-- Admin Staff (dengan referral code)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'adminstaff@reviewup.local',
  crypt('Reviewup@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"adminstaff","role":"admin_staff","referral_code":"STAFF001"}'::jsonb,
  now(), now(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'adminstaff@reviewup.local'
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at,
  created_at, updated_at
)
SELECT
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.email, now(), now(), now()
FROM auth.users u
WHERE u.email = 'adminstaff@reviewup.local'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE provider_id = u.email
  );

-- Member
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'member@reviewup.local',
  crypt('Reviewup@123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"member","role":"member"}'::jsonb,
  now(), now(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'member@reviewup.local'
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at,
  created_at, updated_at
)
SELECT
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.email, now(), now(), now()
FROM auth.users u
WHERE u.email = 'member@reviewup.local'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE provider_id = u.email
  );

-- Set referral code untuk admin_staff profile (created by trigger)
UPDATE public.profiles
SET referral_code = 'STAFF001'
WHERE username = 'adminstaff' AND referral_code IS NULL;
