import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, profiles, tasks } from "@/lib/db/schema";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { TasksTable } from "./_components/tasks-table";

export default async function AdminTaskPage() {
  const rows = await db
    .select({
      id: tasks.id,
      memberId: tasks.memberId,
      productId: tasks.productId,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
      queue: tasks.queue,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
      memberUsername: profiles.username,
      productName: products.name,
    })
    .from(tasks)
    .leftJoin(profiles, eq(tasks.memberId, profiles.id))
    .leftJoin(products, eq(tasks.productId, products.id))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Tugas" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <TasksTable
          initialTasks={rows.map((r) => ({
            id: r.id,
            memberId: r.memberId,
            memberUsername: r.memberUsername ?? "(user dihapus)",
            productName: r.productName ?? "(produk dihapus)",
            price: r.price,
            commission: r.commission,
            status: r.status,
            queue: r.queue,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
