-- Migration: local upload metadata table
-- Date: 2026-07-20
-- Spec: docs/superpowers/specs/2026-07-20-better-auth-migration-design.md

CREATE TABLE IF NOT EXISTS "uploaded_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "disk" text NOT NULL DEFAULT 'local',
  "category" text NOT NULL,
  "original_name" text NOT NULL,
  "stored_name" text NOT NULL,
  "relative_path" text NOT NULL,
  "mime_type" text NOT NULL,
  "extension" text,
  "size_bytes" integer NOT NULL,
  "checksum_sha256" text,
  "visibility" text NOT NULL DEFAULT 'private',
  "owner_user_id" uuid,
  "created_by" uuid,
  "product_id" bigint,
  "deposit_id" integer,
  "withdrawal_id" integer,
  "profile_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_relative_path_unique" UNIQUE ("relative_path");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_owner_user_id_profiles_id_fk"
    FOREIGN KEY ("owner_user_id") REFERENCES "profiles"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_created_by_profiles_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_deposit_id_deposits_id_fk"
    FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_withdrawal_id_withdrawals_id_fk"
    FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "uploaded_files"
    ADD CONSTRAINT "uploaded_files_profile_id_profiles_id_fk"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "uploaded_files_category_idx"
  ON "uploaded_files" ("category");
CREATE INDEX IF NOT EXISTS "uploaded_files_owner_user_id_idx"
  ON "uploaded_files" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_created_by_idx"
  ON "uploaded_files" ("created_by");
CREATE INDEX IF NOT EXISTS "uploaded_files_product_id_idx"
  ON "uploaded_files" ("product_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_deposit_id_idx"
  ON "uploaded_files" ("deposit_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_withdrawal_id_idx"
  ON "uploaded_files" ("withdrawal_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_profile_id_idx"
  ON "uploaded_files" ("profile_id");
CREATE INDEX IF NOT EXISTS "uploaded_files_visibility_idx"
  ON "uploaded_files" ("visibility");
