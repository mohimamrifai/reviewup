import { AdminNav } from "../dashboard/_components/admin-nav";
import { AccountsTable } from "./_components/accounts-table";

export default function AdminAccountPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Rekening" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <AccountsTable />
      </div>
    </div>
  );
}
