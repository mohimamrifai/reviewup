ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "banned" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ban_reason" text,
  ADD COLUMN IF NOT EXISTS "ban_expires" timestamp with time zone;

ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonated_by" uuid;

DO $$ BEGIN
  ALTER TABLE "session"
    ADD CONSTRAINT "session_impersonated_by_user_id_fk"
    FOREIGN KEY ("impersonated_by") REFERENCES "user"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
