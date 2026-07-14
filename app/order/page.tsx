import { Package } from "lucide-react";

import { OrderCard } from "./_components/order-card";
import { PageHeader } from "./_components/header";
import { BottomNav } from "../_components/bottom-nav";

const orders = [
  {
    id: "1",
    title: "Pompa Galon Elektrik Miyako AWD-200 BK USB Rechargeable",
    status: { label: "Dipilih", variant: "blue" as const },
    priceLabel: "Harga Produk",
    price: "Rp 70.000",
    commissionLabel: "Komisi",
    commission: "Rp 14.000",
    actionLabel: "Kirimkan",
  },
  {
    id: "2",
    title:
      "KACAMATA BACA MODEL KOREA Anti Radiasi Blueray KACAMATA BACA LENSA PLUS WANIT...",
    status: { label: "Selesai", variant: "green" as const },
    priceLabel: "Harga Produk",
    price: "Rp 29.500",
    commissionLabel: "Komisi",
    commission: "Rp 5.900",
  },
];

export default function OrderPage() {
  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <PageHeader title="Tugas Saya" />

      <div className="mx-auto mt-3 max-w-lg space-y-3 px-4 sm:mt-4 sm:space-y-4 sm:px-6">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            {...order}
            imageSlot={
              <Package
                className="size-6 text-zinc-300 sm:size-8"
                strokeWidth={1.5}
              />
            }
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
