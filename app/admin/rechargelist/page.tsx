import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { deposits, profiles } from "@/lib/db/schema";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { RechargesTable } from "./_components/recharges-table";

export default async function AdminRechargeListPage() {
  const rows = await db
    .select({
      id: deposits.id,
      amount: deposits.amount,
      status: deposits.status,
      proofUrl: deposits.proofUrl,
      notes: deposits.notes,
      createdAt: deposits.createdAt,
      memberUsername: profiles.username,
    })
    .from(deposits)
    .leftJoin(profiles, eq(deposits.memberId, profiles.id))
    .orderBy(desc(deposits.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Deposit" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <RechargesTable
          initialRecharges={rows.map((r) => ({
            id: r.id,
            memberUsername: r.memberUsername ?? "(user dihapus)",
            amount: r.amount,
            status: r.status as "pending" | "approved" | "rejected",
            proofUrl: r.proofUrl,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
