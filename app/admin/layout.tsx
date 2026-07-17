import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminNav } from "@/app/admin/dashboard/_components/admin-nav";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

type Props = {
  children: React.ReactNode;
};

// Pathname → label item menu (lihat AdminNav di dashboard/_components).
// Prefix terpanjang dipakai untuk halaman nested (mis. /admin/staff/[id] → "Semua Staff").
const ACTIVE_BY_PATH: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/task": "Tugas",
  "/admin/rechargelist": "Deposit",
  "/admin/withdrawlist": "Penarikan",
  "/admin/account": "Rekening",
  "/admin/deposit-bank": "Tujuan Deposit",
  "/admin/team": "Tim",
  "/admin/staff": "Semua Staff",
  "/admin/commission": "Komisi",
  "/admin/permissions": "Izin Akses",
  "/admin/users": "Anggota",
  "/admin/product": "Produk",
  "/admin/pelayanan": "Pelayanan",
  "/admin/audit-logs": "Audit Log",
};

function getActiveLabel(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  if (ACTIVE_BY_PATH[pathname]) return ACTIVE_BY_PATH[pathname];
  const keys = Object.keys(ACTIVE_BY_PATH).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname.startsWith(key + "/")) return ACTIVE_BY_PATH[key];
  }
  return "Dashboard";
}

export default async function AdminLayout({ children }: Props) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  // Halaman login punya styling sendiri (tanpa sidebar).
  if (pathname.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    redirect("/admin/login");
  }

  const isSuperAdmin = profile.role === "super_admin";
  const isLeader = profile.role === "admin_leader";
  const active = getActiveLabel(pathname);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 sm:pl-60">
      <AdminNav
        active={active}
        isSuperAdmin={isSuperAdmin}
        isLeader={isLeader}
      />
      {children}
    </div>
  );
}
