"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Star, X } from "lucide-react";

import { useToast } from "@/app/_components/toast";
import { updateTaskStatus, type TaskReviewState } from "@/lib/actions/tasks-admin";

type Props = {
  taskId: number;
  productName: string;
  commission: string;
  onClose: () => void;
  onCompleted: () => void;
};

const initialState: TaskReviewState = {};

export function RatingModal({
  taskId,
  productName,
  commission,
  onClose,
  onCompleted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [state, action] = useActionState(updateTaskStatus, initialState);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  useEffect(() => {
    if (state.success) {
      show(state.message ?? "Tugas berhasil dikirim.", "success");
      onCompleted();
    } else if (state.error) {
      show(state.error, "error");
    }
  }, [state, onCompleted, show]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function handleSubmit() {
    const fd = new FormData();
    fd.set("taskId", String(taskId));
    fd.set("status", "selesai");
    if (rating > 0) {
      fd.set("notes", `Rating: ${rating}/5`);
    }
    startTransition(() => action(fd));
  }

  const display = hoverRating || rating;
  const canSubmit = rating > 0 && !pending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Beri Rating"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 sm:text-lg">
            Beri Rating
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-1 text-center text-[11px] text-zinc-500 sm:text-xs">
          {productName}
        </div>
        <div className="mb-4 text-center text-[11px] text-zinc-500 sm:text-xs">
          Komisi diterima: <span className="font-semibold text-zinc-900">{commission}</span>
        </div>

        <div
          className="mb-5 flex items-center justify-center gap-1.5"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = display >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} bintang`}
                className="rounded-md p-1 transition hover:scale-110"
              >
                <Star
                  className={`size-7 transition ${
                    filled
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-300"
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                Mengirim...
              </span>
            ) : (
              "Kirim Sekarang"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-300"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
