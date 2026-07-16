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

import { ProfileHeader } from "./_components/header";
import { BalanceCard } from "./_components/balance-card";
import { LogoutRow } from "./_components/logout-row";
import { QuickActions } from "./_components/quick-actions";
import { PromoBanner } from "./_components/promo-banner";
import { SecondaryActions } from "./_components/secondary-actions";
import { SectionCard } from "./_components/section-card";
import { ActionRow } from "./_components/action-row";
import { BottomNav } from "../_components/bottom-nav";

export default function ProfilPage() {
  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <ProfileHeader name="Testfs" tier="Classic" score={100} status="Online" />

      <div className="relative z-10 mx-auto -mt-10 max-w-2xl px-4 sm:-mt-12 sm:px-6">
        <BalanceCard label="Total Saldo" amount="Rp 35.900" />

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
