import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, tasks } from "@/lib/db/schema";
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

const SUBMITTABLE = ["menunggu", "dipilih", "dikerjakan"];

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
    .where(eq(tasks.memberId, user.id))
    .orderBy(desc(tasks.createdAt));

  const orders = rows.map((r) => {
    const meta = STATUS_LABEL[r.status] ?? { label: r.status, variant: "zinc" as const };
    return {
      id: r.id,
      title: r.productName ?? "(produk dihapus)",
      imageUrl: r.imageUrl,
      status: r.status,
      statusLabel: meta.label,
      statusVariant: meta.variant,
      price: r.price,
      commission: r.commission,
      canSubmit: SUBMITTABLE.includes(r.status),
    };
  });

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <PageHeader title="Tugas Saya" />

      <div className="mx-auto mt-3 max-w-lg space-y-3 px-4 sm:mt-4 sm:space-y-4 sm:px-6">
        <OrdersList initialOrders={orders} />
      </div>

      <BottomNav />
    </div>
  );
}
