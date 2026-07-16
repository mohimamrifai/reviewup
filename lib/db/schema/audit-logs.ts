import { sql } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

/**
 * Audit log untuk perubahan yang dilakukan admin terhadap data member.
 * Dipakai untuk mencatat perubahan saldo manual, perubahan level, dll.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }),
    note: text("note"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_target_id_idx").on(table.targetId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
