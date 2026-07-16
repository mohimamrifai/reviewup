import { sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  userLevel,
  userRole,
  userStatus,
} from "./enums";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    role: userRole("role").notNull().default("member"),
    level: userLevel("level").notNull().default("classic"),
    creditScore: integer("credit_score").notNull().default(100),
    balance: numeric("balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    frozenBalance: numeric("frozen_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    phone: text("phone"),
    withdrawPasswordHash: text("withdraw_password_hash"),
    referralCode: text("referral_code"),
    referredBy: uuid("referred_by"),
    status: userStatus("status").notNull().default("online"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex("profiles_username_idx").on(table.username),
    uniqueIndex("profiles_referral_code_idx").on(table.referralCode),
    index("profiles_referred_by_idx").on(table.referredBy),
    index("profiles_role_idx").on(table.role),
  ],
);
