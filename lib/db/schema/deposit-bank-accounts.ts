import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", { id: uuid("id").primaryKey() });

/**
 * Rekening tujuan DEPOSIT (bukan rekening penarikan member).
 * Ditampilkan ke member di halaman `/recharge`.
 * Hanya admin leader & super admin yang bisa CRUD.
 */
export const depositBankAccounts = pgTable(
  "deposit_bank_accounts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    bankName: text("bank_name").notNull(),
    accountName: text("account_name").notNull(),
    accountNumber: text("account_number").notNull(),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => authUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index("deposit_bank_accounts_is_active_idx").on(table.isActive)],
);
