import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { depositBankAccounts, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import { DepositBankTable } from "./_components/deposit-bank-table";

export default async function AdminDepositBankPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me || me.role === "member") redirect("/admin/login");

  // Hanya leader & super admin yang boleh akses
  if (me.role !== "admin_leader" && me.role !== "super_admin") {
    redirect("/admin/dashboard");
  }

  const rows = await db
    .select({
      id: depositBankAccounts.id,
      bankName: depositBankAccounts.bankName,
      accountName: depositBankAccounts.accountName,
      accountNumber: depositBankAccounts.accountNumber,
      notes: depositBankAccounts.notes,
      isActive: depositBankAccounts.isActive,
    })
    .from(depositBankAccounts)
    .orderBy(desc(depositBankAccounts.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Rekening Tujuan Deposit
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          Daftar rekening yang ditampilkan ke member di halaman deposit. Hanya
          rekening berstatus Aktif yang akan muncul. Nonaktifkan rekening
          untuk menyembunyikan tanpa menghapus.
        </p>
      </div>

      <DepositBankTable
        initialAccounts={rows.map((r) => ({
          id: r.id,
          bankName: r.bankName,
          accountName: r.accountName,
          accountNumber: r.accountNumber,
          notes: r.notes,
          isActive: r.isActive,
        }))}
      />
    </div>
  );
}
