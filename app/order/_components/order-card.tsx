import type { ReactNode } from "react";

type StatusVariant = "blue" | "green" | "yellow" | "rose";

const statusClass: Record<StatusVariant, string> = {
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

type Status = {
  label: string;
  variant: StatusVariant;
};

type Props = {
  imageSlot?: ReactNode;
  title: string;
  status: Status;
  priceLabel: string;
  price: string;
  commissionLabel: string;
  commission: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function OrderCard({
  imageSlot,
  title,
  status,
  priceLabel,
  price,
  commissionLabel,
  commission,
  actionLabel,
  onAction,
}: Props) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-zinc-200/60">
      <div className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 sm:size-20">
          {imageSlot}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground sm:text-sm">
            {title}
          </p>
          <span
            className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${statusClass[status.variant]}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 sm:text-sm">{priceLabel}</span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {price}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 sm:text-sm">
            {commissionLabel}
          </span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {commission}
          </span>
        </div>
      </div>

      {actionLabel && (
        <div className="flex justify-end border-t border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={onAction}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 active:brightness-90 sm:px-5 sm:py-2 sm:text-sm"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </article>
  );
}
