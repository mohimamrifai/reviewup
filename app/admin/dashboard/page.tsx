import { AdminNav } from "./_components/admin-nav";
import { DashboardDateRange } from "./_components/dashboard-date-range";
import { PeriodCard } from "./_components/period-card";
import { StatCard } from "./_components/stat-card";
import { getDashboardStats, parseDateRange } from "@/lib/dashboard";

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatRupiahCompact(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return formatRupiah(value);
}

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = parseDateRange(params.from, params.to);
  const stats = await getDashboardStats(range);

  const periodLabel = range ? "Periode Dipilih" : "Sepanjang Waktu";
  const periodLabelToday = range ? "Periode Dipilih" : "Hari Ini";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Dashboard" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <DashboardDateRange />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <StatCard
            label="Total Member"
            value={stats.totalMembers.toLocaleString("id-ID")}
            variant="indigo"
          />
          <StatCard
            label={`Pendaftaran (${periodLabelToday})`}
            value={stats.rangeRegistrations.toLocaleString("id-ID")}
            variant="amber"
          />
          <StatCard
            label={`Depo Awal (${periodLabelToday})`}
            value={stats.rangeDepositRequests.toLocaleString("id-ID")}
            variant="emerald"
          />
          <StatCard
            label={`Deposit (${periodLabelToday})`}
            value={formatRupiah(stats.rangeDepositAmount)}
            variant="blue"
          />
          <StatCard
            label={`Penarikan (${periodLabelToday})`}
            value={formatRupiah(stats.rangeWithdrawalAmount)}
            variant="rose"
          />
          <StatCard
            label={`Profit (${periodLabelToday})`}
            value={formatRupiah(stats.rangeProfit)}
            variant="emerald"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <PeriodCard
            title={`Total Isi Ulang (${periodLabel})`}
            amount={formatRupiahCompact(stats.totalDepositAmount)}
            variant="blue"
          />
          <PeriodCard
            title={`Total Penarikan (${periodLabel})`}
            amount={formatRupiahCompact(stats.totalWithdrawalAmount)}
            variant="red"
          />
        </div>
      </div>
    </div>
  );
}
