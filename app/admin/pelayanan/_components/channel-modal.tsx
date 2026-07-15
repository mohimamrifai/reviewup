"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

import type { Channel, ChannelType } from "../../../../lib/dummy-channels";

const types: { value: ChannelType; label: string; placeholder: string }[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/6281234567890",
  },
  {
    value: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/nama_channel",
  },
];

type Props = {
  initial: Channel | null;
  onSave: (data: { id: number | null; type: ChannelType; label: string; url: string }) => void;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

export function ChannelModal({ initial, onSave, onClose }: Props) {
  const [type, setType] = useState<ChannelType>(initial?.type ?? "whatsapp");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const found = types.find((t) => t.value === type);
    if (found && !url) {
      setUrl(found.placeholder);
    }
  }, [type, url]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label wajib diisi.");
      return;
    }
    if (!url.trim()) {
      setError("URL wajib diisi.");
      return;
    }
    onSave({ id: initial?.id ?? null, type, label: label.trim(), url: url.trim() });
  }

  const currentType = types.find((t) => t.value === type);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit channel" : "Tambah channel"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {initial ? "Edit Channel" : "Tambah Channel"}
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

        <div className="space-y-3">
          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Jenis Layanan</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ChannelType)}
              className={inputClass}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Label</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="cth: Customer Service 1"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentType?.placeholder}
              className={inputClass}
            />
          </label>

          {error && (
            <p className="text-xs font-medium text-rose-600 sm:text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:text-sm"
          >
            <Save className="size-3.5" />
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
