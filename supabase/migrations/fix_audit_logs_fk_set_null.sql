-- Fix audit_logs FK agar admin yang punya riwayat audit log bisa dihapus.
-- Sebelumnya:
--   - actor_id  : NOT NULL + ON DELETE RESTRICT (admin tidak bisa dihapus)
--   - target_id : NOT NULL + ON DELETE CASCADE  (audit log hilang saat target dihapus)
-- Sesudah:
--   - actor_id  : NULL + ON DELETE SET NULL (audit log dipertahankan, actor jadi NULL)
--   - target_id : NULL + ON DELETE SET NULL (audit log dipertahankan, target jadi NULL)
-- Tujuannya: admin bisa dihapus walau punya audit log; compliance data tetap utuh.

ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_profiles_id_fk";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_target_id_profiles_id_fk";

ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "target_id" DROP NOT NULL;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_profiles_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_target_id_profiles_id_fk"
  FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
