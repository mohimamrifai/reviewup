import { AdminNav } from "../dashboard/_components/admin-nav";
import { PelayananTable } from "./_components/pelayanan-table";

export default function AdminPelayananPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Pelayanan" />

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

        <PelayananTable />
      </div>
    </div>
  );
}
