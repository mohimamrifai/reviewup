-- Tambah kolom access_overrides ke profiles untuk izin akses tambahan per-admin
-- Format JSON: { "fullAccess": true, "canCreateStaff": true, "canCreateLeader": true, "commissionEdit": true, "depositBankCrud": true }
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "access_overrides" jsonb NOT NULL DEFAULT '{}'::jsonb;
