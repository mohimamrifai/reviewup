/**
 * SHIM: backward-compatible Supabase-style client.
 *
 * Setelah migrasi ke Better Auth, banyak file (40+) masih import
 * `createClient` dari sini dan memanggil `supabase.auth.getUser()`.
 *
 * Daripada rewrite 40+ file, kita shim: `getUser()` baca session dari
 * Better Auth, return shape yang sama.
 *
 * Method lain (`signInWithPassword`, `signOut`, `updateUser`, dll.)
 * TIDAK di-shim di sini — file yang butuh itu (lib/actions/auth.ts,
 * lib/actions/change-password.ts) sudah di-rewrite pakai Better Auth
 * langsung. Kalau ada panggilan yang lolos, akan throw di runtime
 * (bukan silent fail), supaya kita tahu harus update.
 */
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Shape minimal yang dibutuhkan consuming code: `data.user.id` dan
 * kadang `email`. Sesuaikan jika ada kebutuhan tambahan.
 */
type SessionUserShape = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};

export async function createClient() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });

  const user: SessionUserShape | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        user_metadata: (session.user as { username?: string }).username
          ? { username: (session.user as { username?: string }).username }
          : undefined,
      }
    : null;

  // Supabase client (untuk `.from()`, `.storage()`, `.rpc()`) — TIDAK di-shim.
  // Hanya namespace `auth` yang di-replace ke Better Auth.
  const rest = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null as null }),
      /**
       * TIDAK LAGI DIPAKAI setelah migrasi Better Auth. Kalau ada kode
       * yang masih pakai, kita throw supaya cepat diketahui.
       */
      signInWithPassword: notSupported("signInWithPassword"),
      signOut: notSupported("signOut"),
      updateUser: notSupported("updateUser"),
    },
    // Forward Supabase client untuk storage + PostgREST
    from: rest.from.bind(rest),
    storage: rest.storage,
    rpc: rest.rpc.bind(rest),
  };
}

function notSupported(method: string) {
  return () => {
    throw new Error(
      `[lib/supabase/server.ts shim] supabase.auth.${method} tidak lagi didukung. ` +
        `Gunakan Better Auth API langsung: auth.api.* (server) atau authClient.* (client). ` +
        `Lihat docs/superpowers/specs/2026-07-20-better-auth-migration-design.md.`,
    );
  };
}
