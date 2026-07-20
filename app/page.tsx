import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import {
  Package,
} from "lucide-react";

import { db } from "@/lib/db";
import { products as productsTable } from "@/lib/db/schema";
import fallbackProducts from "./_components/fallback-data";

import { BottomNav } from "./_components/bottom-nav";
import { PartnerStrip } from "./_components/partner-strip";
import { ProductCard } from "./_components/product-card";
import { PromoMarquee } from "./_components/promo-marquee";
import { TopBar } from "./_components/top-bar";

import formatRupiah from "@/lib/format-rupiah";

export default async function HomePage() {
  // Tarik produk aktif dari database (maks 8 agar jumlah card konsisten).
  // Kalau database tidak punya produk aktif, gunakan fallback statis.
  let dbProducts: {
    id: number;
    name: string;
    imageUrl: string | null;
    price: string;
  }[] = [];
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        imageUrl: productsTable.imageUrl,
        price: productsTable.price,
      })
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(desc(productsTable.createdAt))
      .limit(8);
    dbProducts = rows;
  } catch {
    // DB error: pakai fallback agar halaman tidak crash
  }

  const useFallback = dbProducts.length === 0;

  return (
    <div className="min-h-full bg-zinc-50 pb-28">
      <TopBar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mt-3 overflow-hidden rounded-2xl sm:mt-4">
          <Image
            src="/banner.webp"
            alt="Dekorasi Toko"
            width={1024}
            height={409}
            priority
            className="h-auto w-full"
          />
        </div>

        <PromoMarquee />

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
          {useFallback
            ? fallbackProducts.map(({ id, title, price, icon: Icon }) => (
                <ProductCard
                  key={id}
                  title={title}
                  price={price}
                  href="#"
                  imageSlot={
                    <Icon
                      className="size-10 text-zinc-300 sm:size-14"
                      strokeWidth={1.4}
                    />
                  }
                />
              ))
            : dbProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  title={p.name}
                  price={formatRupiah(p.price)}
                  href="#"
                  imageSlot={
                    p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package
                        className="size-10 text-zinc-300 sm:size-14"
                        strokeWidth={1.4}
                      />
                    )
                  }
                />
              ))}
        </div>

        <PartnerStrip />
      </div>

      <BottomNav />
    </div>
  );
}
