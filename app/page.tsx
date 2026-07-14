import Image from "next/image";
import {
  Footprints,
  Headphones,
  Shirt,
  Tv,
  Wallet,
  Watch,
  Wind,
} from "lucide-react";

import { BottomNav } from "./_components/bottom-nav";
import { PartnerStrip } from "./_components/partner-strip";
import { ProductCard } from "./_components/product-card";
import { PromoMarquee } from "./_components/promo-marquee";
import { TopBar } from "./_components/top-bar";

const products = [
  {
    id: "1",
    title: "JAM TANGAN ALEXANDRE CHRISTIE AC 8161 COUPLE MURAH.",
    price: "Rp2.350.000",
    href: "/product/jam-tangan-alexandre",
    icon: Watch,
  },
  {
    id: "2",
    title: "SMILE&ART Junior Hoodie II SMILE&ART Sweater Hoodie II Sweater Olbring…",
    price: "Rp38.950",
    href: "/product/smile-art-hoodie",
    icon: Shirt,
  },
  {
    id: "3",
    title: "TZ BAJU SWEATSHIRT PRIA PR SANTAI GUNUNG DISTRO KEREN M…",
    price: "Rp38.461",
    href: "/product/tz-sweatshirt",
    icon: Shirt,
  },
  {
    id: "4",
    title: "TTWS M19 HEADSET",
    price: "Rp31.500",
    href: "/product/ttws-headset",
    icon: Headphones,
  },
  {
    id: "5",
    title: "DWEBLIES kipas mini portable angin kipas L size Portable Digital Display…",
    price: "Rp69.000",
    href: "/product/dweblies-fan",
    icon: Wind,
  },
  {
    id: "6",
    title: "Dompet Wanita Aurora Bordir Premium Berkualitas Dompet Pendek Genggam",
    price: "Rp15.900",
    href: "/product/dompet-aurora",
    icon: Wallet,
  },
  {
    id: "7",
    title: "MXQ PRO Android TV Box 4K HD Smart Set Top Box 64GB Ram 512GB Rom…",
    price: "Rp184.900",
    href: "/product/mxq-pro",
    icon: Tv,
  },
  {
    id: "8",
    title: "Sandal Pria keren Sandal slip on Pria santai Gunung Pria original 100 cowok k…",
    price: "Rp102.900",
    href: "/product/sandal-pria",
    icon: Footprints,
  },
];

export default function HomePage() {
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
          {products.map(({ id, title, price, href, icon: Icon }) => (
            <ProductCard
              key={id}
              title={title}
              price={price}
              href={href}
              imageSlot={
                <Icon
                  className="size-10 text-zinc-300 sm:size-14"
                  strokeWidth={1.4}
                />
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
