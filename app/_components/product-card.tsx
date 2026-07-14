import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  price: string;
  href: string;
  imageSlot?: ReactNode;
};

export function ProductCard({ title, price, href, imageSlot }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-zinc-200/60">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100">
        {imageSlot}
      </div>
      <div className="p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium leading-snug text-foreground sm:min-h-10 sm:text-xs">
          {title}
        </h3>
        <p className="mt-1.5 text-xs font-bold text-foreground sm:text-sm">
          {price}
        </p>
        <Link
          href={href}
          className="mt-2 block rounded-full bg-brand px-3 py-1.5 text-center text-[11px] font-semibold text-white transition hover:brightness-95 active:brightness-90 sm:py-2 sm:text-xs"
        >
          Beli sekarang
        </Link>
      </div>
    </article>
  );
}
