import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { commissionSettings, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_LABEL, LEVEL_RATE_PERCENT } from "@/lib/levels";

import { CommissionSettingsTable } from "./_components/commission-settings-table";

export default async function CommissionSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const scope = await getScope(user.id);
  if (!scope || (scope.role !== "super_admin" && scope.overrides.commissionEdit !== true)) {
    redirect("/admin/commission");
  }

  const isSuperAdmin = scope.role === "super_admin";

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Ambil semua setting (kalau ada)
  const settings = await db
    .select()
    .from(commissionSettings)
    .orderBy(asc(commissionSettings.level));

  const percentByLevel = new Map<string, string>();
  for (const s of settings) percentByLevel.set(s.level, String(s.percent));

  const rows = (Object.keys(LEVEL_LABEL) as Array<keyof typeof LEVEL_LABEL>).map((lvl) => ({
    level: lvl,
    label: LEVEL_LABEL[lvl],
    currentPercent: percentByLevel.get(lvl) ?? String(LEVEL_RATE_PERCENT[lvl]),
    defaultPercent: String(LEVEL_RATE_PERCENT[lvl]),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Pengaturan Persentase Komisi
        </h1>
        <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
          Atur persentase komisi per level member. Perubahan langsung berlaku
          pada tugas baru setelah cache berakhir (maks 1 menit).
        </p>
        <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
          Kosongkan kolom untuk kembali ke default.
        </p>
      </div>

      <CommissionSettingsTable initialRows={rows} />
    </div>
  );
}
