-- Tambah kolom `leader_id` di profiles untuk menandai staff di bawah leader tertentu.
-- NULL berarti:
--   - untuk role 'member'      → tidak di bawah leader manapun (orphan atau direct referral ke staff)
--   - untuk role 'admin_staff' → staff belum di-assign ke leader manapun
--   - untuk role 'admin_leader' → NULL (leader tidak punya leader di atasnya)
--   - untuk role 'super_admin' → NULL
--
-- Logic: leader melihat aggregate member dari SEMUA staff yang `leader_id` = leader.id.
-- Staff langsung melihat member dengan `referred_by` = staff.id (tidak lewat leader).

ALTER TABLE "profiles"
  ADD COLUMN "leader_id" uuid;

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_leader_id_profiles_id_fk"
  FOREIGN KEY ("leader_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE no action;

CREATE INDEX "profiles_leader_id_idx" ON "profiles" USING btree ("leader_id");
