import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { products, profiles, tasks } from "@/lib/db/schema";
import { type Level } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

import { AdminNav } from "../dashboard/_components/admin-nav";
import { TasksTable } from "./_components/tasks-table";

export default async function AdminTaskPage() {
  // Identifikasi admin yang login
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [me] = await db
    .select({ id: profiles.id, role: profiles.role, referralCode: profiles.referralCode })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!me || me.role === "member") redirect("/admin/login");

  const scope = await getScope(user.id);
  // memberIds null = unrestricted (super admin). [] = no access.
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  // Ambil anggota yang relevan sesuai scope
  let memberRows: { id: string; username: string; level: Level; status: string }[];
  if (unrestricted) {
    // Super admin: semua member
    memberRows = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        level: profiles.level,
        status: profiles.status,
      })
      .from(profiles)
      .where(eq(profiles.role, "member"))
      .orderBy(profiles.username);
  } else if (memberIds && memberIds.length > 0) {
    // Staff/Leader: hanya member di scope
    memberRows = await db
      .select({
        id: profiles.id,
        username: profiles.username,
        level: profiles.level,
        status: profiles.status,
      })
      .from(profiles)
      .where(inArray(profiles.id, memberIds))
      .orderBy(profiles.username);
  } else {
    memberRows = [];
  }

  // Ambil produk aktif
  const productRows = await db
    .select({ id: products.id, name: products.name, isActive: products.isActive })
    .from(products)
    .orderBy(products.name);

  // Query tasks dengan filter scope
  const taskWhere = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(tasks.memberId, memberIds)
      : eq(tasks.memberId, "00000000-0000-0000-0000-000000000000");

  const baseQuery = db
    .select({
      id: tasks.id,
      memberId: tasks.memberId,
      productId: tasks.productId,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
      queue: tasks.queue,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
      memberUsername: profiles.username,
      productName: products.name,
    })
    .from(tasks)
    .leftJoin(profiles, eq(tasks.memberId, profiles.id))
    .leftJoin(products, eq(tasks.productId, products.id));

  const rows = taskWhere
    ? await baseQuery.where(taskWhere).orderBy(desc(tasks.createdAt))
    : await baseQuery.orderBy(desc(tasks.createdAt));

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <AdminNav active="Tugas" />

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
        <TasksTable
          initialTasks={rows.map((r) => ({
            id: r.id,
            memberId: r.memberId,
            memberUsername: r.memberUsername ?? "(user dihapus)",
            productName: r.productName ?? "(produk dihapus)",
            price: r.price,
            commission: r.commission,
            status: r.status,
            queue: r.queue,
            createdAt: r.createdAt.toISOString(),
          }))}
          members={memberRows.map((m) => ({
            id: m.id,
            username: m.username,
            level: m.level,
            status: m.status,
          }))}
          products={productRows.map((p) => ({
            id: p.id,
            name: p.name,
            isActive: p.isActive,
          }))}
        />
      </div>
    </div>
  );
}
