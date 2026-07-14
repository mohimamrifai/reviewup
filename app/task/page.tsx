import { InfoBox } from "./_components/info-box";
import { MemberCard } from "./_components/member-card";
import { StatGrid } from "./_components/stat-grid";
import { TaskBalanceCard } from "./_components/balance-card";
import { CommissionTicker } from "./_components/commission-ticker";
import { BottomNav } from "../_components/bottom-nav";

export default function TaskPage() {
  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 sm:pt-6">
        <TaskBalanceCard
          label="Saldo Akun"
          amount="Rp 35.900"
          topUpHref="/isi-ulang"
          withdrawHref="/tarik"
        />

        <StatGrid
          stats={[
            { label: "Total Komisi", value: "Rp 5.900" },
            { label: "Saldo Beku", value: "Rp 0" },
            { label: "Pendanaan", value: "Rp 0" },
            { label: "Tugas", value: "1 / 5" },
          ]}
        />

        <MemberCard title="Classic Member" subtitle="Komisi: 20%" />

        <button
          type="button"
          className="mt-3 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:brightness-90 sm:mt-4 sm:py-3 sm:text-base"
        >
          Mulai Tugas
        </button>

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
