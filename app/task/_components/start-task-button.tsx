"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/app/_components/toast";
import { requestTask } from "@/lib/actions/tasks-member";

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
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (hasActiveTask) {
      show("Kamu sudah memiliki tugas yang belum di kerjakan.", "error");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      const result = await requestTask({}, fd);
      if (result.error) return;
      router.push(orderHref);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:brightness-90 disabled:opacity-60 sm:mt-4 sm:py-3 sm:text-base"
    >
      {pending && <Loader2 className="size-3.5 animate-spin sm:size-4" />}
      {label}
    </button>
  );
}
