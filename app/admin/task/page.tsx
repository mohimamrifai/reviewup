import { AdminNav } from "../dashboard/_components/admin-nav";
import { TasksTable } from "./_components/tasks-table";

export default function AdminTaskPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Tugas" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <TasksTable />
      </div>
    </div>
  );
}
