/**
 * Reset database lalu jalankan seed akun development.
 *
 *   pnpm run db:seed    (atau `pnpm run db seed`)
 *
 * 1. Membersihkan semua data (audit_logs, bank_accounts, deposits, withdrawals,
 *    tasks, task_requests, products, deposit_bank_accounts, customer_service_channels,
 *    profiles, auth.identities, auth.users).
 * 2. Menjalankan supabase/seed.sql untuk membuat 5 akun development
 *    (superadmin, adminleader, adminstaff, member, rinasyah).
 *
 * Memerlukan DATABASE_URL di .env.local (atau .env) — string koneksi
 * transaction-mode pooler Supabase.
 */

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

async function runFile(client, absPath) {
  const sql = await readFile(absPath, "utf8");
  await client.query(sql);
  console.log(`  OK  ${absPath.replace(root + "/", "")}`);
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
  await runFile(
    client,
    join(root, "supabase/migrations/cleanup_dev_data.sql"),
  );
  console.log("→ Seed akun development...");
  await runFile(client, join(root, "supabase/seed.sql"));
  console.log("Selesai. Database sudah bersih dan ter-seed.");
} catch (e) {
  console.error("Seed gagal:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
