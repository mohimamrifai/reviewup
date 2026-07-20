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
    <article className="overflow-hidden rounded-xl bg-white text-center shadow-sm ring-1 ring-zinc-200/70">
      <div className="relative md:m-4 m-2 aspect-square overflow-hidden rounded-md bg-zinc-50">
        <div className="flex h-full w-full items-center justify-center">
          {imageSlot}
        </div>
      </div>
      <div className="space-y-2 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-8 text-[11px] font-medium uppercase leading-tight tracking-wide text-zinc-900 sm:min-h-10 sm:text-xs">
          {title}
        </h3>
        <p className="text-sm font-extrabold text-emerald-600 sm:text-base">
          {price}
        </p>
        <Link
          href={href}
          className="block rounded-md bg-emerald-600 px-3 py-2 text-center text-[11px] font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-xs"
        >
          Beli sekarang
        </Link>
      </div>
    </article>
  );
}
