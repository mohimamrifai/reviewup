-- Tabel pengaturan persentase komisi per level
-- Single row per level (PK = level)
CREATE TABLE IF NOT EXISTS "commission_settings" (
  "level" user_level PRIMARY KEY,
  "percent" numeric(5, 2) NOT NULL CHECK ("percent" >= 0 AND "percent" <= 100),
  "updated_by" uuid REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Seed default percentages (copy dari lib/levels.ts LEVEL_RATE_PERCENT)
INSERT INTO "commission_settings" ("level", "percent") VALUES
  ('classic', 20),
  ('silver', 25),
  ('gold', 30),
  ('platinum', 35),
  ('diamond', 40),
  ('premier', 50)
ON CONFLICT ("level") DO NOTHING;
