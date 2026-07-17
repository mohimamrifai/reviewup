"use client";

import { useState } from "react";

import { OrderCard } from "./order-card";

type Order = {
  id: number;
  title: string;
  imageUrl: string | null;
  status: string;
  statusLabel: string;
  statusVariant: "blue" | "green" | "yellow" | "rose" | "amber" | "zinc";
  price: string;
  commission: string;
  canSubmit: boolean;
};

type Props = {
  initialOrders: Order[];
};

export function OrdersList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  function handleSubmitted(id: number) {
    // Tugas yang sudah 'dikerjakan' dihilangkan dari daftar.
    // Status final ke 'selesai' akan ditentukan admin.
    setOrders((cur) => cur.filter((o) => o.id !== id));
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/60 sm:text-sm">
        Belum ada tugas.
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onSubmitted={handleSubmitted}
        />
      ))}
    </div>
  );
}
