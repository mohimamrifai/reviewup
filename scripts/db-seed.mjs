// scripts/db-seed.mjs

import { randomUUID } from "node:crypto";
import { hashPassword } from "@better-auth/utils/password";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[seed] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, {
  prepare: false,
  max: 1,
});

const syntheticEmail = (username) =>
  `${username.toLowerCase()}@reviewup.app`;

function generateReferralCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "STAFF-";

  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return out;
}

const SEED_USERS = [
  {
    username: "superadmin",
    password: "Reviewup@123",
    role: "super_admin",
  },
  {
    username: "adminleader",
    password: "Reviewup@123",
    role: "admin_leader",
  },
  {
    username: "adminstaff",
    password: "Reviewup@123",
    role: "admin_staff",
    leaderUsername: "adminleader",
    referralCode: "STAFF001",
  },
  {
    username: "member",
    password: "Reviewup@123",
    role: "member",
    balance: "30000",
  },
  {
    username: "rinasyah",
    password: "jika123",
    role: "member",
    referrerUsername: "adminstaff",
    withdrawPassword: "123456",
  },
];

async function lookupProfileId(username) {
  if (!username) return null;

  const rows = await sql`
    SELECT id 
    FROM profiles 
    WHERE username = ${username}
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

async function ensureUser(spec) {
  const {
    username,
    password,
    role,
    leaderUsername,
    referrerUsername,
    referralCode: manualReferral,
    balance,
    withdrawPassword,
  } = spec;

  const existingRows = await sql`
    SELECT u.id, p.role AS profile_role
    FROM "user" u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.username = ${username}
    LIMIT 1
  `;

  const existing = existingRows[0];

  if (existing) {
    console.log(
      `[seed] skip @${username} — sudah ada (profile role=${existing.profile_role ?? "?"})`
    );

    return existing.id;
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const email = syntheticEmail(username);
  const now = new Date();

  await sql`
    INSERT INTO "user" (
      id,
      name,
      email,
      email_verified,
      username,
      display_username,
      role,
      banned,
      created_at,
      updated_at
    )
    VALUES (
      ${userId},
      ${username},
      ${email},
      false,
      ${username},
      ${username},
      ${role},
      false,
      ${now},
      ${now}
    )
  `;

  await sql`
    INSERT INTO account (
      id,
      user_id,
      provider_id,
      account_id,
      password,
      created_at,
      updated_at
    )
    VALUES (
      ${randomUUID()},
      ${userId},
      'credential',
      ${email},
      ${passwordHash},
      ${now},
      ${now}
    )
  `;

  const leaderId = await lookupProfileId(leaderUsername);
  const referredBy = await lookupProfileId(referrerUsername);

  let resolvedReferral = null;

  if (role === "admin_staff") {
    resolvedReferral =
      manualReferral ?? generateReferralCode();
  }

  await sql`
    INSERT INTO profiles (
      id,
      username,
      role,
      level,
      credit_score,
      balance,
      frozen_balance,
      referral_code,
      referred_by,
      leader_id,
      access_overrides,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${userId},
      ${username},
      ${role},
      'classic',
      100,
      ${balance ?? 0},
      0,
      ${resolvedReferral},
      ${referredBy},
      ${leaderId},
      '{}'::jsonb,
      'online',
      ${now},
      ${now}
    )
  `;

  if (withdrawPassword) {
    await sql`
      UPDATE profiles
      SET withdraw_password_hash = extensions.crypt(
        ${withdrawPassword},
        extensions.gen_salt('bf', 10)
      )
      WHERE id = ${userId}
    `;
  }

  console.log(
    `[seed] created @${username} (${role})`
  );

  return userId;
}

try {
  console.log("[seed] mulai...");

  for (const user of SEED_USERS) {
    await ensureUser(user);
  }

  console.log("[seed] selesai.");
} catch (error) {
  console.error("[seed] gagal:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}