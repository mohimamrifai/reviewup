-- Tabel rekening tujuan deposit (untuk ditampilkan ke member di halaman /recharge).
-- Hanya admin leader & super admin yang bisa CRUD.
-- Berbeda dari `bank_accounts` (rekening penarikan milik member).

CREATE TABLE IF NOT EXISTS "deposit_bank_accounts" (
  "id" bigserial PRIMARY KEY,
  "bank_name" text NOT NULL,
  "account_name" text NOT NULL,
  "account_number" text NOT NULL,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "deposit_bank_accounts_is_active_idx" ON "deposit_bank_accounts" USING btree ("is_active");
