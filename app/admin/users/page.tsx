import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { MembersTable } from "./_components/members-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me || me.role === "member") redirect("/admin/login");

  const scope = await getScope(user.id);
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  // Filter: hanya role=member, dan (kalau tidak unrestricted) sesuai scope
  const baseWhere = eq(profiles.role, "member");
  const whereClause = unrestricted
    ? baseWhere
    : memberIds && memberIds.length > 0
      ? inArray(profiles.id, memberIds)
      : eq(profiles.id, "__no_access__");

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      phone: profiles.phone,
      level: profiles.level,
      creditScore: profiles.creditScore,
      balance: profiles.balance,
      frozenBalance: profiles.frozenBalance,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(whereClause)
    .orderBy(desc(profiles.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Anggota" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <MembersTable
          initialMembers={rows.map((r) => ({
            id: r.id,
            username: r.username,
            phone: r.phone,
            level: r.level,
            creditScore: r.creditScore,
            balance: r.balance,
            frozenBalance: r.frozenBalance,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
