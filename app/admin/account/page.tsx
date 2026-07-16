import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bankAccounts, profiles } from "@/lib/db/schema";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { AccountsTable } from "./_components/accounts-table";

export default async function AdminAccountPage() {
  const rows = await db
    .select({
      id: bankAccounts.id,
      bankName: bankAccounts.bankName,
      accountName: bankAccounts.accountName,
      accountNumber: bankAccounts.accountNumber,
      backupPhone: bankAccounts.backupPhone,
      isPrimary: bankAccounts.isPrimary,
      createdAt: bankAccounts.createdAt,
      userId: profiles.id,
      username: profiles.username,
      role: profiles.role,
      phone: profiles.phone,
    })
    .from(bankAccounts)
    .innerJoin(profiles, eq(bankAccounts.userId, profiles.id))
    .orderBy(desc(bankAccounts.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Rekening" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <AccountsTable
          initialAccounts={rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            username: r.username,
            role: r.role,
            phone: r.phone,
            bankName: r.bankName,
            accountName: r.accountName,
            accountNumber: r.accountNumber,
            backupPhone: r.backupPhone,
            isPrimary: r.isPrimary,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
