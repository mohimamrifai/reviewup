import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bankAccounts, profiles, withdrawals } from "@/lib/db/schema";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { WithdrawsTable } from "./_components/withdraws-table";

export default async function AdminWithdrawListPage() {
  const rows = await db
    .select({
      id: withdrawals.id,
      amount: withdrawals.amount,
      status: withdrawals.status,
      notes: withdrawals.notes,
      createdAt: withdrawals.createdAt,
      memberUsername: profiles.username,
      bankName: bankAccounts.bankName,
      accountName: bankAccounts.accountName,
      accountNumber: bankAccounts.accountNumber,
    })
    .from(withdrawals)
    .leftJoin(profiles, eq(withdrawals.memberId, profiles.id))
    .leftJoin(bankAccounts, eq(withdrawals.bankAccountId, bankAccounts.id))
    .orderBy(desc(withdrawals.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Penarikan" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <WithdrawsTable
          initialWithdraws={rows.map((r) => ({
            id: r.id,
            memberUsername: r.memberUsername ?? "(user dihapus)",
            bankName: r.bankName ?? "—",
            accountName: r.accountName ?? "—",
            accountNumber: r.accountNumber ?? "—",
            amount: r.amount,
            status: r.status as "pending" | "completed" | "rejected",
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
