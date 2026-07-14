"use client";

import { useMemo, useState } from "react";

import { AdminNav } from "./_components/admin-nav";
import { DateRangePicker } from "./_components/date-range-picker";
import { PeriodCard } from "./_components/period-card";
import { StatCard } from "./_components/stat-card";

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function getSeed(from: string, to: string): number {
  return (from + to)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getDashboardData(from: string, to: string) {
  const hasRange = Boolean(from && to);

  if (!hasRange) {
    return {
      daily: [
        {
          label: "Pendaftaran (Hari Ini)",
          value: "2",
          variant: "amber" as const,
        },
        {
          label: "Depo Awal (Hari Ini)",
          value: "0",
          variant: "emerald" as const,
        },
        {
          label: "Deposit (Hari Ini)",
          value: "Rp 0",
          variant: "blue" as const,
        },
        {
          label: "Penarikan (Hari Ini)",
          value: "Rp 0",
          variant: "rose" as const,
        },
        {
          label: "Profit (Hari Ini)",
          value: "Rp 0",
          variant: "emerald" as const,
        },
      ],
      periods: [
        {
          title: "Total Isi Ulang (Sepanjang Waktu)",
          amount: "Rp 0",
          variant: "blue" as const,
        },
        {
          title: "Total Penarikan (Sepanjang Waktu)",
          amount: "Rp 0",
          variant: "red" as const,
        },
      ],
    };
  }

  const days =
    Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) +
    1;
  const seed = getSeed(from, to);

  const registrasi = days * 2 + (seed % 7);
  const depoAwal = seed % 3;
  const deposit = days * 12_500 + (seed % 9) * 4_500;
  const penarikan = days * 3_200 + (seed % 5) * 2_100;
  const profit = Math.max(0, deposit - penarikan);
  const totalIsiUlang = days * 8_750 + (seed % 11) * 5_200;
  const totalPenarikan = days * 2_400 + (seed % 6) * 1_800;

  return {
    daily: [
      {
        label: "Pendaftaran (Periode Dipilih)",
        value: String(registrasi),
        variant: "amber" as const,
      },
      {
        label: "Depo Awal (Periode Dipilih)",
        value: String(depoAwal),
        variant: "emerald" as const,
      },
      {
        label: "Deposit (Periode Dipilih)",
        value: formatRupiah(deposit),
        variant: "blue" as const,
      },
      {
        label: "Penarikan (Periode Dipilih)",
        value: formatRupiah(penarikan),
        variant: "rose" as const,
      },
      {
        label: "Profit (Periode Dipilih)",
        value: formatRupiah(profit),
        variant: "emerald" as const,
      },
    ],
    periods: [
      {
        title: "Total Isi Ulang (Periode Dipilih)",
        amount: formatRupiah(totalIsiUlang),
        variant: "blue" as const,
      },
      {
        title: "Total Penarikan (Periode Dipilih)",
        amount: formatRupiah(totalPenarikan),
        variant: "red" as const,
      },
    ],
  };
}

export default function AdminDashboardPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { daily, periods } = useMemo(
    () => getDashboardData(from, to),
    [from, to]
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Dashboard" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onReset={() => {
            setFrom("");
            setTo("");
          }}
        />

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <StatCard label="Total Member" value="2" variant="indigo" />
          {daily.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          {periods.map((period) => (
            <PeriodCard key={period.title} {...period} />
          ))}
        </div>
      </div>
    </div>
  );
}
