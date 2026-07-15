"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

const items = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Anggota", href: "/admin/users" },
  { label: "Tugas", href: "/admin/task" },
  { label: "Deposit", href: "/admin/rechargelist" },
  { label: "Penarikan", href: "/admin/withdrawlist" },
  { label: "Rekening", href: "/admin/account" },
  { label: "Produk", href: "/admin/product" },
  { label: "Pelayanan", href: "/admin/pelayanan" },
];

type Props = {
  active: string;
};

export function AdminNav({ active }: Props) {
  const [open, setOpen] = useState(false);
  const activeItem = items.find((i) => i.label === active);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("nav")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <nav className="relative bg-slate-800 text-slate-300">
      <div className="flex items-center justify-between px-3 py-2.5 sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          className="rounded-md p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <span className="text-sm font-semibold text-white">
          {activeItem?.label ?? "Admin"}
        </span>
        <Link
          href="/admin/logout"
          aria-label="Logout"
          className="rounded-md p-1.5 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="size-4" />
        </Link>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 border-t border-slate-700 bg-slate-800 shadow-lg sm:hidden">
          <ul className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto px-3 py-2">
            {items.map(({ label, href }) => {
              const isActive = label === active;
              return (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-1 border-t border-slate-700 pt-1">
              <Link
                href="/admin/logout"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                Logout
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div className="hidden px-3 py-2.5 sm:block sm:px-4">
        <ul className="flex items-center justify-center gap-1 sm:gap-2">
          {items.map(({ label, href }) => {
            const isActive = label === active;
            return (
              <li key={label}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-block whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          <li className="ml-2 sm:ml-4">
            <Link
              href="/admin/logout"
              className="inline-block whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 sm:px-4 sm:text-sm"
            >
              Logout
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
