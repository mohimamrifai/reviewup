-- Fix Better Auth UUID defaults
-- Better Auth session/account/verification inserts rely on database-generated IDs.

ALTER TABLE "user"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "session"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "account"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "verification"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
