import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { BottomNav } from "../_components/bottom-nav";
import { db } from "@/lib/db";
import { depositBankAccounts, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import { RechargeForm } from "./_components/recharge-form";

export default async function RechargePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [me] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  // Hanya member yang boleh akses halaman deposit
  if (!me || me.role !== "member") redirect("/");

  const accounts = await db
    .select({
      id: depositBankAccounts.id,
      bankName: depositBankAccounts.bankName,
      accountName: depositBankAccounts.accountName,
      accountNumber: depositBankAccounts.accountNumber,
      notes: depositBankAccounts.notes,
    })
    .from(depositBankAccounts)
    .where(eq(depositBankAccounts.isActive, true))
    .orderBy(desc(depositBankAccounts.createdAt));

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <h1 className="mx-auto max-w-2xl px-4 py-3 text-center text-sm font-bold sm:px-6 sm:py-3.5 sm:text-base">
          Isi Ulang Saldo
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
        <RechargeForm
          accounts={accounts.map((a) => ({
            id: a.id,
            bankName: a.bankName,
            accountName: a.accountName,
            accountNumber: a.accountNumber,
            notes: a.notes,
          }))}
        />
      </div>

      <BottomNav />
    </div>
  );
}
