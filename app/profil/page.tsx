import {
  ArrowDownToLine,
  Bell,
  FileText,
  Headphones,
  History,
  KeyRound,
  Landmark,
  LogOut,
  Wallet,
} from "lucide-react";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import { ProfileHeader } from "./_components/header";
import { BalanceCard } from "./_components/balance-card";
import { LogoutRow } from "./_components/logout-row";
import { QuickActions } from "./_components/quick-actions";
import { PromoBanner } from "./_components/promo-banner";
import { SecondaryActions } from "./_components/secondary-actions";
import { SectionCard } from "./_components/section-card";
import { ActionRow } from "./_components/action-row";
import { BottomNav } from "../_components/bottom-nav";

const TIER_LABEL: Record<string, string> = {
  classic: "Classic",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
  premier: "Premier",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  banned: "Banned",
};

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return "Rp " + num.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile] = user
    ? await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)
    : [];

  const name = profile?.username ?? "Pengguna";
  const tier = TIER_LABEL[profile?.level ?? "classic"] ?? "Classic";
  const score = profile?.creditScore ?? 0;
  const status = STATUS_LABEL[profile?.status ?? "online"] ?? "Online";
  const balance = profile?.balance ?? "0";

  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <ProfileHeader
        name={name}
        tier={tier}
        score={score}
        status={status}
      />

      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-4 sm:-mt-12 sm:px-6">
        <BalanceCard label="Total Saldo" amount={formatRupiah(balance)} />

        <QuickActions
          items={[
            { icon: Landmark, label: "Bank", href: "/bank" },
            { icon: ArrowDownToLine, label: "Tarik", href: "/withdraw" },
            { icon: Wallet, label: "Isi Ulang", href: "/recharge" },
            { icon: Headphones, label: "Bantuan", href: "/support" },
          ]}
        />

        <PromoBanner />

        <SecondaryActions
          actions={[
            { label: "Buka Toko", href: "https://www.tokopedia.com/" },
            { label: "Daftar Affiliate", href: "https://www.tokopedia.com/" },
          ]}
        />

        <SectionCard title="Aktivitas Saya">
          <ActionRow
            icon={FileText}
            label="Riwayat Penarikan"
            href="/profil/withdrawlist"
          />
          <ActionRow
            icon={History}
            label="Riwayat Isi Ulang"
            href="/profil/rechargelist"
          />
          <ActionRow
            icon={Bell}
            label="Pemberitahuan"
            href="/profil/notification"
          />
          <ActionRow
            icon={KeyRound}
            label="Ganti Sandi"
            href="/profil/change-password"
          />
        </SectionCard>

        <SectionCard title="Bantuan">
          <ActionRow
            icon={Headphones}
            label="Layanan Pelanggan"
            href="/support"
          />
          <LogoutRow icon={LogOut} label="Keluar" />
        </SectionCard>
      </div>

      <BottomNav />
    </div>
  );
}
