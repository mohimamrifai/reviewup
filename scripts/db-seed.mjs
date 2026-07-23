// scripts/db-seed.mjs
//
// Seed akun awal untuk VPS / fresh database.
//
// Data akun mengikuti catatan di tasks.md:
//   - superadmin  / Reviewup@123  → super_admin
//   - adminleader / Reviewup@123  → admin_leader
//   - adminstaff  / Reviewup@123  → admin_staff, di bawah adminleader, referral STAFF001
//   - member      / Reviewup@123  → member, saldo awal Rp30.000
//   - rinasyah    / jika123       → member, dirujuk adminstaff, sandi penarikan 123456
//
// Idempotent: skip akun yang sudah ada (diidentifikasi via username).

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

const sql = postgres(url, { prepare: false, max: 1 });

const syntheticEmail = (username) => `${username.toLowerCase()}@reviewup.app`;

/** Huruf acak tanpa karakter ambigu (I, L, O, 0, 1). */
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

/**
 * Resolve username → profile id, atau null kalau belum ada.
 * Dipakai untuk mengisi leaderId (admin_staff) dan referredBy (member test).
 */
async function lookupProfileId(username) {
  if (!username) return null;
  const [row] = await sql`
    SELECT id FROM profiles WHERE username = ${username} LIMIT 1
  `;
  return row?.id ?? null;
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

  // Skip kalau user sudah ada.
  const [existing] = await sql`
    SELECT u.id, p.role AS profile_role
    FROM "user" u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.username = ${username}
    LIMIT 1
  `;
  if (existing) {
    console.log(
      `[seed] skip @${username} — sudah ada (profile role=${existing.profile_role ?? "?"})`,
    );
    return existing.id;
  }

  // Hash password pakai algoritma yang sama dengan Better Auth (scrypt N=16384).
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const email = syntheticEmail(username);
  const now = new Date();

  // 1. Insert ke tabel Better Auth `user`.
  await sql`
    INSERT INTO "user" (
      id, name, email, email_verified, username, display_username, role, banned, created_at, updated_at
    ) VALUES (
      ${userId}, ${username}, ${email}, false, ${username}, ${username},
      ${role}, false, ${now}, ${now}
    )
  `;

  // 2. Insert credential account + password hash.
  await sql`
    INSERT INTO account (
      id, user_id, provider_id, account_id, password, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${userId}, 'credential', ${email}, ${passwordHash}, ${now}, ${now}
    )
  `;

  // 3. Resolve relasi (leader / referrer) SEBELUM insert profile.
  //    Order di SEED_USERS sudah dijamin dependency muncul lebih dulu,
    //    tapi lookup defensif supaya tidak crash kalau user menjalankan subset.
  const leaderId = await lookupProfileId(leaderUsername);
  const referredBy = await lookupProfileId(referrerUsername);

  // 4. Tentukan referral code final. Untuk admin_staff: pakai manual kalau
  //    diisi, kalau tidak generate otomatis. Untuk role lain: NULL.
  let resolvedReferral = null;
  if (role === "admin_staff") {
    resolvedReferral = manualReferral ?? generateReferralCode();
  }

  // 5. Insert profile dengan role & relasi yang sesuai.
  await sql`
    INSERT INTO profiles (
      id, username, role, level, credit_score, balance, frozen_balance,
      referral_code, referred_by, leader_id, access_overrides, status,
      created_at, updated_at
    ) VALUES (
      ${userId}, ${username}, ${role}, 'classic', 100,
      ${balance ?? "0"}, "0",
      ${resolvedReferral}, ${referredBy}, ${leaderId},
      '{}'::jsonb, 'online',
      ${now}, ${now}
    )
  `;

  // 6. Set sandi penarikan (bcrypt via extension PostgreSQL).
  if (withdrawPassword) {
    await sql`
      UPDATE profiles
      SET withdraw_password_hash = extensions.crypt(
        ${withdrawPassword}, extensions.gen_salt('bf', 10)
      )
      WHERE id = ${userId}
    `;
  }

  console.log(
    `[seed] created @${username} (${role})${
      resolvedReferral ? ` referral=${resolvedReferral}` : ""
    }`,
  );
  return userId;
}

try {
  console.log("[seed] mulai...");
  for (const spec of SEED_USERS) {
    await ensureUser(spec);
  }
  console.log("[seed] selesai.");
} catch (err) {
  console.error(
    "[seed] gagal:",
    err instanceof Error ? err.message : err,
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}
