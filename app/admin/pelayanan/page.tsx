import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { customerServiceChannels } from "@/lib/db/schema";

import { PelayananTable } from "./_components/pelayanan-table";

export default async function AdminPelayananPage() {
  const rows = await db
    .select({
      id: customerServiceChannels.id,
      type: customerServiceChannels.type,
      label: customerServiceChannels.label,
      url: customerServiceChannels.url,
      isActive: customerServiceChannels.isActive,
      sortOrder: customerServiceChannels.sortOrder,
    })
    .from(customerServiceChannels)
    .orderBy(asc(customerServiceChannels.sortOrder), asc(customerServiceChannels.id));

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/60 sm:p-5">
        <h1 className="text-base font-bold text-zinc-900 sm:text-lg">
          Pelayanan
        </h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Kelola channel layanan pelanggan (WhatsApp &amp; Telegram) yang
          ditampilkan ke anggota.
        </p>
      </div>

      <PelayananTable
        initialChannels={rows.map((r) => ({
          id: r.id,
          type: r.type as "whatsapp" | "telegram",
          label: r.label,
          url: r.url,
          isActive: r.isActive,
          sortOrder: r.sortOrder,
        }))}
      />
    </div>
  );
}
