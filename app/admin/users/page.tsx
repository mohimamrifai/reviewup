import { AdminNav } from "../dashboard/_components/admin-nav";
import { MembersTable } from "./_components/members-table";

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Anggota" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <MembersTable />
      </div>
    </div>
  );
}
