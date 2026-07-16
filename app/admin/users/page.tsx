import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { MembersTable } from "./_components/members-table";

export default async function AdminUsersPage() {
  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      level: profiles.level,
      creditScore: profiles.creditScore,
      balance: profiles.balance,
      frozenBalance: profiles.frozenBalance,
      status: profiles.status,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Anggota" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <MembersTable
          initialMembers={rows.map((r) => ({
            id: r.id,
            username: r.username,
            role: r.role,
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
