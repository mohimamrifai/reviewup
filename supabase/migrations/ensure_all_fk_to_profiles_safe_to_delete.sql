-- ensure_all_fk_to_profiles_safe_to_delete.sql
--
-- Idempotent: pastikan SEMUA foreign key yang menunjuk ke `public.profiles`
-- aman untuk delete (tidak ada yang memblokir dengan RESTRICT).
--
-- Alur constraint yang diharapkan:
--   - audit_logs.actor_id           → ON DELETE SET NULL
--   - audit_logs.target_id          → ON DELETE SET NULL
--   - bank_accounts.user_id         → ON DELETE CASCADE (pemilik dihapus → akun bank ikut hilang)
--   - commission_settings.updated_by → ON DELETE SET NULL
--   - deposit_bank_accounts.created_by → ON DELETE SET NULL
--   - deposits.member_id            → ON DELETE CASCADE
--   - deposits.approved_by          → ON DELETE SET NULL
--   - profiles.leader_id            → ON DELETE SET NULL (self-reference)
--   - profiles.id → auth.users.id   → ON DELETE CASCADE (supabase auth)
--   - task_requests.member_id       → ON DELETE CASCADE
--   - tasks.member_id               → ON DELETE CASCADE
--   - withdrawals.member_id         → ON DELETE CASCADE
--   - withdrawals.processed_by      → ON DELETE SET NULL
--
-- Kolom-kolom referensi harus NULLABLE agar SET NULL bisa diterapkan.

-- 1) audit_logs
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_profiles_id_fk";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_target_id_profiles_id_fk";
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "target_id" DROP NOT NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_profiles_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_id_profiles_id_fk"
  FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 2) bank_accounts (pemilik = member, cascade)
ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "bank_accounts_user_id_profiles_id_fk";
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 3) commission_settings
ALTER TABLE "commission_settings" DROP CONSTRAINT IF EXISTS "commission_settings_updated_by_fkey";
ALTER TABLE "commission_settings" DROP CONSTRAINT IF EXISTS "commission_settings_updated_by_profiles_id_fk";
ALTER TABLE "commission_settings" ALTER COLUMN "updated_by" DROP NOT NULL;
ALTER TABLE "commission_settings" ADD CONSTRAINT "commission_settings_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 4) deposit_bank_accounts
ALTER TABLE "deposit_bank_accounts" DROP CONSTRAINT IF EXISTS "deposit_bank_accounts_created_by_fkey";
ALTER TABLE "deposit_bank_accounts" DROP CONSTRAINT IF EXISTS "deposit_bank_accounts_created_by_profiles_id_fk";
ALTER TABLE "deposit_bank_accounts" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "deposit_bank_accounts" ADD CONSTRAINT "deposit_bank_accounts_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 5) deposits
ALTER TABLE "deposits" DROP CONSTRAINT IF EXISTS "deposits_member_id_profiles_id_fk";
ALTER TABLE "deposits" DROP CONSTRAINT IF EXISTS "deposits_approved_by_profiles_id_fk";
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_member_id_profiles_id_fk"
  FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_approved_by_profiles_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 6) profiles.leader_id (self-reference)
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_leader_id_profiles_id_fk";
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_leader_id_profiles_id_fk"
  FOREIGN KEY ("leader_id") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- 7) task_requests
ALTER TABLE "task_requests" DROP CONSTRAINT IF EXISTS "task_requests_member_id_fkey";
ALTER TABLE "task_requests" DROP CONSTRAINT IF EXISTS "task_requests_member_id_profiles_id_fk";
ALTER TABLE "task_requests" ADD CONSTRAINT "task_requests_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 8) tasks
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_member_id_profiles_id_fk";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_member_id_profiles_id_fk"
  FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- 9) withdrawals
ALTER TABLE "withdrawals" DROP CONSTRAINT IF EXISTS "withdrawals_member_id_profiles_id_fk";
ALTER TABLE "withdrawals" DROP CONSTRAINT IF EXISTS "withdrawals_processed_by_profiles_id_fk";
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_member_id_profiles_id_fk"
  FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_processed_by_profiles_id_fk"
  FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
