import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, taskRequests, tasks } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import { OrdersList } from "./_components/orders-list";
import { PageHeader } from "./_components/header";
import { BottomNav } from "../_components/bottom-nav";

const STATUS_LABEL: Record<string, { label: string; variant: "blue" | "green" | "yellow" | "rose" | "amber" | "zinc" }> = {
  menunggu: { label: "Menunggu", variant: "amber" },
  dipilih: { label: "Dipilih", variant: "blue" },
  dikerjakan: { label: "Dikerjakan", variant: "yellow" },
  selesai: { label: "Selesai", variant: "green" },
  dibatalkan: { label: "Dibatalkan", variant: "rose" },
};

const ACTIVE_TASK_STATUSES = ["dipilih"] as const;

export default async function OrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-full bg-zinc-50 pb-28">
        <PageHeader title="Tugas Saya" />
        <div className="mx-auto mt-3 max-w-lg px-4 sm:mt-4 sm:px-6">
          <p className="text-sm text-zinc-600">Silakan login untuk melihat tugas.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const rows = await db
    .select({
      id: tasks.id,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
      productName: products.name,
      imageUrl: products.imageUrl,
    })
    .from(tasks)
    .leftJoin(products, eq(tasks.productId, products.id))
    .where(
      sql`${tasks.memberId} = ${user.id} AND ${tasks.status} = ANY(${sql.raw(`ARRAY[${ACTIVE_TASK_STATUSES.map((status) => `'${status}'::task_status`).join(",")}]`)})`,
    )
    .orderBy(desc(tasks.createdAt));

  const [pendingRequest] = await db
    .select({ id: taskRequests.id })
    .from(taskRequests)
    .where(eq(taskRequests.memberId, user.id))
    .limit(1);

  const orders = rows.map((row) => {
    const meta = STATUS_LABEL[row.status] ?? {
      label: row.status,
      variant: "zinc" as const,
    };

    return {
      id: row.id,
      title: row.productName ?? "(produk dihapus)",
      imageUrl: row.imageUrl,
      status: row.status,
      statusLabel: meta.label,
      statusVariant: meta.variant,
      price: row.price,
      commission: row.commission,
      canSubmit: row.status === "dipilih",
    };
  });

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <PageHeader title="Tugas Saya" />

      <div className="mx-auto mt-3 max-w-lg px-4 sm:mt-4 sm:px-6">
        {orders.length > 0 ? (
          <OrdersList initialOrders={orders} />
        ) : (
          <p className="text-center text-sm text-zinc-600">
            {pendingRequest
              ? "Belum ada Tugas"
              : "Belum ada tugas"}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
