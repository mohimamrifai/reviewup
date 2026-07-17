-- Tambah kolom commission_rate ke profiles untuk admin_staff
-- Nilai: persentase (0-100). NULL = tidak ada komisi. Default NULL.
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5, 2);
