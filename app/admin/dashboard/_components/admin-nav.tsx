import Link from "next/link";

const items = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Anggota", href: "/admin/anggota" },
  { label: "Tugas", href: "/admin/tugas" },
  { label: "Deposit", href: "/admin/deposit" },
  { label: "Penarikan", href: "/admin/penarikan" },
  { label: "Rekening", href: "/admin/rekening" },
  { label: "Produk", href: "/admin/produk" },
  { label: "Chat", href: "/admin/chat" },
];

type Props = {
  active: string;
};

export function AdminNav({ active }: Props) {
  return (
    <nav className="bg-slate-800 px-3 py-2.5 sm:px-4">
      <ul className="flex items-center justify-center gap-1 overflow-x-auto sm:gap-2">
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
    </nav>
  );
}
