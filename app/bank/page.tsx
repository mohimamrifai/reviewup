import { BottomNav } from "../_components/bottom-nav";
import { BankContent } from "./_components/bank-content";

export default function BankPage() {
  return (
    <div className="min-h-full bg-zinc-50 pb-24">
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-sm">
        <h1 className="mx-auto max-w-2xl px-4 py-3 text-center text-sm font-bold sm:px-6 sm:py-3.5 sm:text-base">
          Informasi Penarikan
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-5">
        <BankContent />
      </div>

      <BottomNav />
    </div>
  );
}
