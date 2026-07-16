-- Audit log untuk perubahan yang dilakukan admin terhadap data member.
-- Mencatat: actor (admin), target (member), action, amount, note.

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid NOT NULL,
  "target_id" uuid NOT NULL,
  "action" text NOT NULL,
  "amount" numeric(15, 2),
  "note" text,
  "metadata" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_id_profiles_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_target_id_profiles_id_fk"
  FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs" USING btree ("target_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
