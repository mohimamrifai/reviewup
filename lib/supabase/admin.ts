/**
 * SHIM: backward-compatible Supabase admin client.
 *
 * Service-role-equivalent untuk Better Auth. Method yang di-shim:
 *   - auth.admin.createUser({ email, password, user_metadata, email_confirm })
 *       → internalAdapter.createUser + linkAccount("credential", password)
 *   - auth.admin.updateUserById(id, { password, user_metadata })
 *       → updateUser (Better Auth user) + updateAccount (password)
 *   - auth.admin.deleteUser(id)
 *       → deleteUser (CASCADE ke session/account + profile)
 *   - auth.admin.listUsers()
 *       → list semua user
 *   - .from("profiles").select() dll. — masih pakai supabase-js PostgREST
 *       (kita TIDAK migrate PostgREST; hanya migrate Auth namespace).
 */
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { auth } from "@/lib/auth";

type UserMetadata = Record<string, unknown>;

type CreateUserArgs = {
  email: string;
  password: string;
  email_confirm?: boolean;
  user_metadata?: UserMetadata;
};

type UpdateUserArgs = {
  password?: string;
  user_metadata?: UserMetadata;
};

type CreatedUser = {
  id: string;
  email: string;
  user_metadata: UserMetadata;
};

export function createAdminClient() {
  const ctxPromise = auth.$context;

  // PostgREST client (untuk `.from(...).select(...)` — masih dipakai banyak
  // kode untuk query langsung ke tabel domain). Hanya namespace `auth` yang
  // kita replace; `.from(...)` masih pakai Supabase PostgREST.
  const rest = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  return {
    auth: {
      admin: {
        createUser: async (args: CreateUserArgs) => {
          try {
            const ctx = await ctxPromise;
            const newUser = await ctx.internalAdapter.createUser({
              email: args.email,
              name: (args.user_metadata?.username as string) ?? args.email,
              emailVerified: args.email_confirm ?? true,
              // additionalFields
              ...(args.user_metadata?.username
                ? { username: args.user_metadata.username as string }
                : {}),
              ...(args.user_metadata?.role
                ? { role: args.user_metadata.role as string }
                : {}),
            });
            const passwordHash = await ctx.password.hash(args.password);
            await ctx.internalAdapter.linkAccount({
              userId: newUser.id,
              providerId: "credential",
              accountId: newUser.id,
              password: passwordHash,
            });
            // Mirror user_metadata ke Better Auth user table (konsistensi
            // dengan pola lama). Best-effort: kalau gagal, log saja.
            if (args.user_metadata) {
              try {
                await ctx.internalAdapter.updateUser(newUser.id, {
                  ...(args.user_metadata.username
                    ? {
                        username: args.user_metadata.username as string,
                        name: args.user_metadata.username as string,
                      }
                    : {}),
                  ...(args.user_metadata.role
                    ? { role: args.user_metadata.role as string }
                    : {}),
                });
              } catch (e) {
                console.warn(
                  "[admin.shim] createUser: updateUser (mirror) gagal:",
                  e,
                );
              }
            }
            return {
              data: {
                user: {
                  id: newUser.id,
                  email: newUser.email,
                  user_metadata: args.user_metadata ?? {},
                } as CreatedUser,
              },
              error: null as null,
            };
          } catch (e) {
            return {
              data: { user: null },
              error: shapeError(e, "createUser"),
            };
          }
        },

        updateUserById: async (id: string, args: UpdateUserArgs) => {
          try {
            const ctx = await ctxPromise;
            const updates: Record<string, unknown> = {};
            if (args.user_metadata) {
              if (typeof args.user_metadata.username === "string") {
                updates.username = args.user_metadata.username;
                updates.name = args.user_metadata.username;
              }
              if (typeof args.user_metadata.role === "string") {
                updates.role = args.user_metadata.role;
              }
            }
            if (Object.keys(updates).length > 0) {
              await ctx.internalAdapter.updateUser(id, updates);
            }
            if (args.password) {
              const accounts = await ctx.internalAdapter.findAccounts(id);
              const cred = accounts.find((a) => a.providerId === "credential");
              if (cred) {
                const passwordHash = await ctx.password.hash(args.password);
                await ctx.internalAdapter.updateAccount(cred.id, {
                  password: passwordHash,
                });
              } else {
                // No credential account — link a new one (edge case)
                const user = await ctx.internalAdapter.findUserById(id);
                if (user) {
                  const passwordHash = await ctx.password.hash(args.password);
                  await ctx.internalAdapter.linkAccount({
                    userId: id,
                    providerId: "credential",
                    accountId: id,
                    password: passwordHash,
                  });
                }
              }
            }
            return { data: { user: { id } }, error: null as null };
          } catch (e) {
            return { data: { user: null }, error: shapeError(e, "updateUserById") };
          }
        },

        deleteUser: async (id: string) => {
          try {
            const ctx = await ctxPromise;
            // Hapus akun + session (CASCADE)
            await ctx.internalAdapter.deleteAccounts(id);
            await ctx.internalAdapter.deleteUserSessions(id);
            await ctx.internalAdapter.deleteUser(id);
            return { data: { user: null }, error: null as null };
          } catch (e) {
            return { data: null, error: shapeError(e, "deleteUser") };
          }
        },

        listUsers: async () => {
          try {
            const ctx = await ctxPromise;
            // listUsers: tidak ada built-in di internalAdapter untuk semua user.
            // Pakai adapter.findMany langsung.
            const users = await ctx.adapter.findMany({
              model: "user",
              limit: 1000,
            });
            const rows = Array.isArray(users)
              ? (users as Array<Record<string, unknown>>)
              : [];
            return {
              data: {
                users: rows.map((u) => ({
                  ...u,
                  user_metadata: {
                    username: u.username,
                    role: u.role,
                  },
                })),
              },
              error: null as null,
            };
          } catch (e) {
            return { data: { users: [] }, error: shapeError(e, "listUsers") };
          }
        },
      },
    },
    // Forward PostgREST (`.from(...).select(...)` dll.)
    from: rest.from.bind(rest),
    rpc: rest.rpc.bind(rest),
  };
}

function shapeError(e: unknown, op: string) {
  if (e instanceof Error) {
    return { name: e.name, message: e.message } as unknown as Error;
  }
  return new Error(`[admin.shim] ${op} error: ${String(e)}`);
}
