export type Status = "menunggu" | "dipilih" | "dikerjakan" | "selesai";

const labels: Record<Status, string> = {
  menunggu: "Menunggu",
  dipilih: "Dipilih",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
};

const styles: Record<Status, string> = {
  menunggu: "bg-zinc-100 text-zinc-700",
  dipilih: "bg-sky-100 text-sky-700",
  dikerjakan: "bg-amber-100 text-amber-700",
  selesai: "bg-emerald-100 text-emerald-700",
};

type Props = {
  status: Status;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
