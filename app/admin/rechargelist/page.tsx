import { AdminNav } from "../dashboard/_components/admin-nav";
import { RechargesTable } from "./_components/recharges-table";

export default function AdminRechargeListPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Deposit" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <RechargesTable />
      </div>
    </div>
  );
}
