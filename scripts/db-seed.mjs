/**
 * Reset database lalu jalankan seed akun development untuk arsitektur Better Auth.
 *
 *   pnpm run db:seed
 *
 * Akun yang dibuat mengikuti `tasks.md`:
 *   - superadmin / Reviewup@123
 *   - adminleader / Reviewup@123
 *   - adminstaff / Reviewup@123 (+ referral code STAFF001)
 *   - member / Reviewup@123
 *   - rinasyah / jika123 (referral STAFF001, sandi penarikan 123456)
 */

import { config } from "dotenv";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Next.js convention: `.env.local` overrides `.env`. Tambah `override: false`
// agar nilai yang sudah di-set dari `.env` tidak ditimpa oleh `.env.local`
// yang kosong/kosong sebagian (dotenv >= 16 defaultnya `true`).
config({ path: join(root, ".env"), override: false });
config({ path: join(root, ".env.local"), override: false });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL tidak ditemukan.\n" +
      "Tambahkan DATABASE_URL ke .env.local (atau .env) di root project.\n" +
      "Lihat .env.example untuk format string koneksi Supabase.",
  );
  process.exit(1);
}

const uploadRoot = join(root, "src", "uploaded");

const seedAccounts = [
  {
    username: "superadmin",
    email: "superadmin@reviewup.app",
    password: "Reviewup@123",
    role: "super_admin",
    balance: "0",
  },
  {
    username: "adminleader",
    email: "adminleader@reviewup.app",
    password: "Reviewup@123",
    role: "admin_leader",
    balance: "0",
  },
  {
    username: "adminstaff",
    email: "adminstaff@reviewup.app",
    password: "Reviewup@123",
    role: "admin_staff",
    balance: "0",
    referralCode: "STAFF001",
  },
  {
    username: "member",
    email: "member@reviewup.app",
    password: "Reviewup@123",
    role: "member",
    balance: "30000",
  },
  {
    username: "rinasyah",
    email: "rinasyah@reviewup.app",
    password: "jika123",
    role: "member",
    balance: "30000",
    withdrawPassword: "123456",
  },
];

async function hashWithdrawPassword(client, password) {
  const { rows } = await client.query(
    "SELECT crypt($1, gen_salt('bf', 10)) AS hash",
    [password],
  );
  return rows[0]?.hash ?? null;
}

async function resetDatabase(client) {
  await client.query("BEGIN");
  try {
    await client.query(`
      TRUNCATE TABLE
        public.audit_logs,
        public.bank_accounts,
        public.deposits,
        public.withdrawals,
        public.tasks,
        public.task_requests,
        public.products,
        public.deposit_bank_accounts,
        public.customer_service_channels,
        public.uploaded_files
      RESTART IDENTITY CASCADE
    `);

    await client.query(`DELETE FROM verification`);
    await client.query(`DELETE FROM "user"`);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function resetUploadDirectory() {
  await rm(uploadRoot, { recursive: true, force: true });
  await mkdir(uploadRoot, { recursive: true });
}

async function insertSeedUser(client, input) {
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);
  const withdrawPasswordHash = input.withdrawPassword
    ? await hashWithdrawPassword(client, input.withdrawPassword)
    : null;

  await client.query(
    `
      INSERT INTO "user" (
        id,
        name,
        email,
        email_verified,
        username,
        display_username,
        role,
        banned
      ) VALUES ($1, $2, $3, true, $4, $5, $6, false)
    `,
    [
      id,
      input.username,
      input.email,
      input.username,
      input.username,
      input.role,
    ],
  );

  await client.query(
    `
      INSERT INTO account (
        id,
        user_id,
        provider_id,
        account_id,
        password
      ) VALUES ($1, $2, 'credential', $3, $4)
    `,
    [randomUUID(), id, input.email, passwordHash],
  );

  await client.query(
    `
      INSERT INTO profiles (
        id,
        username,
        role,
        balance,
        status,
        referral_code,
        referred_by,
        leader_id,
        withdraw_password_hash
      ) VALUES ($1, $2, $3, $4::numeric, 'online', $5, $6, $7, $8)
    `,
    [
      id,
      input.username,
      input.role,
      input.balance,
      input.referralCode ?? null,
      input.referredBy ?? null,
      input.leaderId ?? null,
      withdrawPasswordHash,
    ],
  );

  return id;
}

async function seedDevelopmentAccounts(client) {
  const ids = {};

  ids.superadmin = await insertSeedUser(client, seedAccounts[0]);
  ids.adminleader = await insertSeedUser(client, seedAccounts[1]);
  ids.adminstaff = await insertSeedUser(client, {
    ...seedAccounts[2],
    leaderId: ids.adminleader,
  });
  ids.member = await insertSeedUser(client, seedAccounts[3]);
  ids.rinasyah = await insertSeedUser(client, {
    ...seedAccounts[4],
    referredBy: ids.adminstaff,
  });

  return ids;
}

async function printVerification(client) {
  const { rows } = await client.query(`
    SELECT
      p.username,
      p.role AS profile_role,
      u.role AS auth_role,
      p.balance,
      p.status,
      p.referral_code,
      p.referred_by,
      p.leader_id,
      CASE WHEN p.withdraw_password_hash IS NOT NULL THEN 'set' ELSE NULL END AS withdraw_pw
    FROM profiles p
    INNER JOIN "user" u ON u.id = p.id
    ORDER BY
      CASE p.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin_leader' THEN 2
        WHEN 'admin_staff' THEN 3
        WHEN 'member' THEN 4
      END,
      p.username
  `);

  console.table(rows);
}

const client = new Client({
  connectionString: url,
  // Transaction-mode pooler (port 6543) TIDAK support multi-statement
  // BEGIN/COMMIT dalam satu .query() dengan prepared statements.
  // Kita matikan prepared statements supaya TRUNCATE + DELETE di
  // cleanup_dev_data.sql (yang dibungkus BEGIN/COMMIT) bisa jalan utuh.
  statement_cache_size: 0,
});

try {
  await client.connect();
  console.log("→ Reset database...");
  await resetDatabase(client);
  await resetUploadDirectory();
  console.log("→ Seed akun development...");
  await seedDevelopmentAccounts(client);
  console.log("→ Verifikasi hasil seed...");
  await printVerification(client);
  console.log("Selesai. Database sudah di-reset dan di-seed.");
} catch (e) {
  console.error("Seed gagal:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
