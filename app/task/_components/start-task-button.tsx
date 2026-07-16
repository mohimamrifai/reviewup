"use client";

import { useRouter } from "next/navigation";

import { useToast } from "@/app/_components/toast";

type Props = {
  hasActiveTask: boolean;
  orderHref: string;
  label?: string;
};

export function StartTaskButton({
  hasActiveTask,
  orderHref,
  label = "Mulai Tugas",
}: Props) {
  const router = useRouter();
  const { show } = useToast();

  function handleClick() {
    if (hasActiveTask) {
      show("Kamu masih memiliki tugas aktif.", "error");
      return;
    }
    router.push(orderHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-3 w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:brightness-90 sm:mt-4 sm:py-3 sm:text-base"
    >
      {label}
    </button>
  );
}
