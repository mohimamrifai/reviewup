import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, profiles, tasks } from "@/lib/db/schema";
import { LEVEL_LABEL, LEVEL_RATE_PERCENT } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

import { InfoBox } from "./_components/info-box";
import { MemberCard } from "./_components/member-card";
import { StatGrid } from "./_components/stat-grid";
import { TaskBalanceCard } from "./_components/balance-card";
import { CommissionTicker } from "./_components/commission-ticker";
import { StartTaskButton } from "./_components/start-task-button";
import { BottomNav } from "../_components/bottom-nav";

const ACTIVE_STATUSES = ["menunggu", "dipilih", "dikerjakan"] as const;

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return "Rp " + num.toLocaleString("id-ID");
}

export default async function TaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-full bg-zinc-50 pb-28">
        <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
          <p className="text-sm text-zinc-600">Silakan login untuk melihat tugas.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const [profile] = await db
    .select({
      balance: profiles.balance,
      frozenBalance: profiles.frozenBalance,
      level: profiles.level,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const [activeTaskRow] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.memberId, user.id),
        inArray(tasks.status, [...ACTIVE_STATUSES]),
      ),
    )
    .limit(1);
  const hasActiveTask = Boolean(activeTaskRow);

  const [statsRow] = await db
    .select({
      totalCommission: sql<string>`COALESCE(SUM(CASE WHEN ${tasks.status} = 'selesai' THEN ${tasks.commission} ELSE 0 END), 0)`,
      totalDone: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'selesai')::int`,
    })
    .from(tasks)
    .where(eq(tasks.memberId, user.id));

  const [activeProduct] = hasActiveTask
    ? await db
        .select({ name: products.name, price: products.price })
        .from(tasks)
        .leftJoin(products, eq(tasks.productId, products.id))
        .where(eq(tasks.id, activeTaskRow.id))
        .limit(1)
    : [];

  const balance = Number(profile?.balance ?? 0);
  const totalCommission = Number(statsRow?.totalCommission ?? 0);
  const totalDone = statsRow?.totalDone ?? 0;
  const level = profile?.level ?? "classic";
  const levelLabel = LEVEL_LABEL[level] ?? "Classic";
  const levelRate = LEVEL_RATE_PERCENT[level] ?? 20;

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
        <TaskBalanceCard
          label="Saldo Akun"
          amount={formatRupiah(balance)}
          topUpHref="/recharge"
          withdrawHref="/withdraw"
        />

        <StatGrid
          stats={[
            { label: "Total Komisi", value: formatRupiah(totalCommission) },
            { label: "Saldo Beku", value: formatRupiah(profile?.frozenBalance ?? 0) },
            { label: "Pendanaan", value: formatRupiah(0) },
            { label: "Tugas Selesai", value: String(totalDone) },
          ]}
        />

        <MemberCard
          title={`${levelLabel} Member`}
          subtitle={`Komisi: ${levelRate}%`}
        />

        <StartTaskButton hasActiveTask={hasActiveTask} orderHref="/order" />

        {hasActiveTask && activeProduct?.name ? (
          <p className="mt-2 text-center text-[11px] text-zinc-500 sm:text-xs">
            Tugas aktif: {activeProduct.name}
          </p>
        ) : null}

        <CommissionTicker />

        <InfoBox label="Info:">
          {" "}Setiap pesanan di dalam platform akan di kirimkan secara acak
          kepada akun kerja anggota. Cegah aktivitas ilegal seperti pencucian
          uang dan penarikan dana untuk tujuan buruk setelah di kirim. Pengguna
          harus menyelesaikan pekerjaan setelah data kerja di mulai. Dan tidak
          mungkin untuk membatalkan pekerjaan di tengah jalan. Jika tidak,
          sistem tidak akan mengizinkan penarikan.
        </InfoBox>
      </div>

      <BottomNav />
    </div>
  );
}
