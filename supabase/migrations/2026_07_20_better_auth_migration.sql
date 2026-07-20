-- Migration: Supabase Auth → Better Auth
-- Date: 2026-07-20
-- Spec: docs/superpowers/specs/2026-07-20-better-auth-migration-design.md
--
-- Perubahan:
--   1. Create 4 tabel Better Auth (user, session, account, verification)
--      dengan uuid PK (match dengan profiles.id)
--   2. Drop FK lama profiles_id_users_id_fk (→ auth.users)
--   3. Add FK baru profiles_id_user_id_fk (→ public.user)
--   4. Drop trigger on_auth_user_created + function handle_new_user
--      (auto-create profile sekarang via databaseHook di lib/auth.ts)
--
-- Pre-kondisi (per spec):
--   - DB kosong (semua 5 akun dev sudah hilang). Tidak ada copy data
--     dari auth.users ke public.user.
--   - Data domain (products, bank_accounts, dst) sudah di-backup
--     (lihat scripts/backup-domain-data.py).
--
-- Idempotent: pakai IF EXISTS / IF NOT EXISTS agar bisa di-reapply.

-- ============================================================
-- 1. Create tabel Better Auth
-- ============================================================

CREATE TABLE IF NOT EXISTS "user" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "username" text NOT NULL UNIQUE,
  "role" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "provider_id" text NOT NULL,
  "account_id" text NOT NULL,
  "password" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" uuid PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Index untuk performance session lookup (Better Auth pakai token untuk query)
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session"("user_id");
CREATE INDEX IF NOT EXISTS "session_expires_at_idx" ON "session"("expires_at");
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account"("user_id");
CREATE INDEX IF NOT EXISTS "account_provider_account_idx" ON "account"("provider_id", "account_id");

-- ============================================================
-- 2. Alter FK profiles: dari auth.users → public.user
-- ============================================================

-- Drop FK lama ke Supabase Auth
ALTER TABLE "profiles"
  DROP CONSTRAINT IF EXISTS "profiles_id_users_id_fk";

-- Add FK baru ke Better Auth user table
-- (dilakukan setelah tabel user dibuat di step 1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_user_id_fk'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_id_user_id_fk"
      FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

-- ============================================================
-- 3. Drop trigger + function Supabase Auth lama
-- ============================================================
-- Profile auto-creation sekarang di-handle oleh
-- databaseHooks.user.create.after di lib/auth.ts (Better Auth).

DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
DROP FUNCTION IF EXISTS "public"."handle_new_user"();

-- ============================================================
-- 4. Verifikasi akhir (output)
-- ============================================================
DO $$
DECLARE
  v_user_count int;
  v_profile_count int;
  v_fk_target text;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM "user";
  SELECT COUNT(*) INTO v_profile_count FROM "profiles";

  -- Cek FK profiles.id
  SELECT ccu.table_schema || '.' || ccu.table_name
    INTO v_fk_target
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'profiles_id_user_id_fk';

  RAISE NOTICE 'Migration selesai:';
  RAISE NOTICE '  - public.user: % baris', v_user_count;
  RAISE NOTICE '  - public.profiles: % baris', v_profile_count;
  RAISE NOTICE '  - profiles FK target: %', COALESCE(v_fk_target, '(FK tidak ditemukan!)');
END $$;
