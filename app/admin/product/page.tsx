import { AdminNav } from "../dashboard/_components/admin-nav";
import { ProductsTable } from "./_components/products-table";

export default function AdminProductPage() {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Produk" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <ProductsTable />
      </div>
    </div>
  );
}
