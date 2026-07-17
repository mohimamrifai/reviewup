-- ============================================================
-- Migration: Ensure all profiles columns from updated schema
-- ============================================================
-- Jalankan file ini di Supabase SQL Editor untuk menambahkan
-- kolom-kolom yang mungkin belum ada di production database.
-- Idempotent (aman dijalankan berulang kali).
--
-- Background:
--   - `init_schema.sql` membuat tabel profiles dengan kolom original.
--   - Migrasi terpisah (`add_leader_id_to_profiles.sql`,
--     `add_commission_rate.sql`, `add_access_overrides.sql`)
--     menambahkan 3 kolom baru yang dipakai schema TypeScript.
--   - Error runtime "Failed query" biasanya terjadi jika migrasi
--     tambahan belum dijalankan di production.
-- ============================================================

-- 1. leader_id — menandai staff di bawah leader tertentu
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "leader_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_leader_id_profiles_id_fk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE "public"."profiles"
      ADD CONSTRAINT "profiles_leader_id_profiles_id_fk"
      FOREIGN KEY ("leader_id") REFERENCES "public"."profiles"("id")
      ON DELETE SET NULL ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "profiles_leader_id_idx"
  ON "public"."profiles" USING btree ("leader_id");

-- 2. commission_rate — persentase komisi untuk admin_staff (0-100)
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5, 2);

-- 3. access_overrides — JSON izin akses tambahan per-admin
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "access_overrides" jsonb
  NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 4. commission_settings table (jika belum ada)
-- ============================================================
CREATE TABLE IF NOT EXISTS "commission_settings" (
  "level" user_level PRIMARY KEY,
  "percent" numeric(5, 2) NOT NULL CHECK ("percent" >= 0 AND "percent" <= 100),
  "updated_by" uuid REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Seed default percentages (idempotent)
INSERT INTO "commission_settings" ("level", "percent") VALUES
  ('classic', 20),
  ('silver', 25),
  ('gold', 30),
  ('platinum', 35),
  ('diamond', 40),
  ('premier', 50)
ON CONFLICT ("level") DO NOTHING;

-- ============================================================
-- Verifikasi
-- ============================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'leader_id',
    'commission_rate',
    'access_overrides'
  )
ORDER BY column_name;
