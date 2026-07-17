"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertCanAccessMember, getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { type Level, getCommissionRate } from "@/lib/levels";
import { auditLogs, products, profiles, taskRequests, tasks } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  taskId: z.coerce.number().int().positive("ID tugas tidak valid."),
  status: z.enum(
    ["menunggu", "dipilih", "dikerjakan", "selesai", "dibatalkan"],
    { message: "Status tidak valid." },
  ),
  notes: z.string().trim().max(500).optional(),
});

export type TaskReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireUser(): Promise<{
  userId: string;
  isAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!profile) throw new Error("UNAUTHENTICATED");
  return { userId: user.id, isAdmin: profile.role !== "member" };
}

async function requireAdmin(): Promise<string> {
  const { userId, isAdmin } = await requireUser();
  if (!isAdmin) throw new Error("FORBIDDEN");
  return userId;
}

function handleAuthError(e: unknown): TaskReviewState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN") return { error: "Anda tidak memiliki akses admin." };
  if (msg === "FORBIDDEN_SCOPE")
    return { error: "Anggota ini bukan bagian dari tim Anda." };
  return { error: "Sesi habis, silakan login ulang." };
}

async function assertScopeForMember(memberId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");
  try {
    assertCanAccessMember(scope, memberId);
  } catch {
    throw new Error("FORBIDDEN_SCOPE");
  }
}

export async function updateTaskStatus(
  _prev: TaskReviewState,
  formData: FormData,
): Promise<TaskReviewState> {
  let actorId: string;
  let isAdmin: boolean;
  try {
    const ctx = await requireUser();
    actorId = ctx.userId;
    isAdmin = ctx.isAdmin;
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = statusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { taskId, status: newStatus, notes } = parsed.data;

  // Member hanya boleh submit tugas dari 'dipilih' ke 'dikerjakan'.
  // Admin bebas ubah status apa pun.
  if (!isAdmin) {
    if (newStatus !== "dikerjakan") {
      return { error: "Anda hanya bisa mengirim (dikerjakan) tugas sendiri." };
    }
  }

  // 1. Tangkap status lama, update status, dan ambil member_id & commission
  //    dalam satu CTE. Penting: `t` CTE membaca status sebelum UPDATE
  //    sehingga `prev_status` benar-benar status lama.
  const updated = await db.execute<{
    id: number;
    member_id: string;
    commission: string;
    prev_status: string;
  }>(sql`
    WITH t AS (
      SELECT id, member_id, commission, status AS prev_status
      FROM tasks
      WHERE id = ${taskId}
        ${isAdmin ? sql`` : sql`AND member_id = ${actorId} AND status = 'dipilih'::task_status`}
      FOR UPDATE
    ),
    upd AS (
      UPDATE tasks
      SET status = ${newStatus}::task_status,
          updated_at = now(),
          completed_at = CASE
            WHEN ${newStatus}::task_status = 'selesai' THEN now()
            ELSE completed_at
          END
      WHERE id = (SELECT id FROM t)
      RETURNING id, member_id
    )
    SELECT id, member_id, commission, prev_status FROM t
  `);

  if (updated.length === 0) {
    return {
      error: isAdmin
        ? "Tugas tidak ditemukan."
        : "Tugas tidak ditemukan, bukan milik Anda, atau belum dipilih admin.",
    };
  }

  const row = updated[0];

  // Validasi scope: admin hanya boleh update tugas member di timnya
  if (isAdmin) {
    try {
      await assertScopeForMember(row.member_id);
    } catch (e) {
      return handleAuthError(e);
    }
  }
  const wasAlreadySelesai = row.prev_status === "selesai";
  const justCompleted = newStatus === "selesai" && !wasAlreadySelesai;
  const justCancelledFromDikerjakan =
    newStatus === "dibatalkan" && row.prev_status === "dikerjakan";

  if (!justCompleted && !justCancelledFromDikerjakan) {
    // Audit log untuk perubahan status tanpa perubahan saldo.
    await db.insert(auditLogs).values({
      actorId: actorId,
      targetId: row.member_id,
      action: isAdmin ? "task_status_changed" : "task_submitted",
      note: notes
        ? `Tugas #${taskId} status → ${newStatus}: ${notes}`
        : `Tugas #${taskId} status → ${newStatus}.`,
      metadata: JSON.stringify({
        taskId,
        from: row.prev_status,
        to: newStatus,
      }),
    });
    revalidatePath("/admin/task");
    revalidatePath("/order");
    return {
      success: true,
      message: isAdmin
        ? wasAlreadySelesai
          ? "Tugas sudah pernah ditandai selesai."
          : "Status tugas diperbarui."
        : "Tugas berhasil dikirim. Mohon tunggu admin verifikasi.",
    };
  }

  if (justCancelledFromDikerjakan) {
    // Tugas 'dikerjakan' -> 'dibatalkan': komisi hangus, kurangi frozen_balance.
    const frz = await db.execute<{
      member_id: string;
      level: Level;
      final_amount: string;
    }>(sql`
      WITH
        m AS (
          SELECT id, level, frozen_balance
          FROM profiles
          WHERE id = ${row.member_id}
          FOR UPDATE
        ),
        fin AS (
          SELECT
            m.id AS member_id,
            (${row.commission}::numeric * CASE m.level
              WHEN 'classic' THEN 1.0
              WHEN 'silver' THEN 1.25
              WHEN 'gold' THEN 1.5
              WHEN 'platinum' THEN 1.75
              WHEN 'diamond' THEN 2.0
              WHEN 'premier' THEN 2.5
            END) AS final_amount
          FROM m
        ),
        upd_frz AS (
          UPDATE profiles
          SET frozen_balance = GREATEST(frozen_balance - (SELECT final_amount FROM fin), 0),
              updated_at = now()
          WHERE id = (SELECT member_id FROM fin)
          RETURNING id, level
        )
      SELECT
        upd_frz.id AS member_id,
        upd_frz.level,
        (SELECT final_amount FROM fin)::text AS final_amount
      FROM upd_frz
    `);

    if (frz.length === 0) return { error: "Gagal mengurangi saldo beku." };
    const f = frz[0];

    await db.insert(auditLogs).values({
      actorId,
      targetId: f.member_id,
      action: "task_rejected",
      amount: f.final_amount,
      note: notes
        ? `Tugas #${taskId} ditolak: ${notes}`
        : `Tugas #${taskId} ditolak. Komisi hangus.`,
      metadata: JSON.stringify({
        taskId,
        from: "dikerjakan",
        to: "dibatalkan",
        finalAmount: f.final_amount,
      }),
    });
    revalidatePath("/admin/task");
    revalidatePath("/admin/users");
    revalidatePath("/order");
    revalidatePath("/profil");
    return { success: true, message: `Tugas #${taskId} ditolak. Komisi hangus.` };
  }

  // 2. Transisi 'selesai':
  //    - Jika dari 'dikerjakan': komisi sudah ada di frozen_balance, geser ke balance.
  //    - Jika dari status lain (mis. 'dipilih'): tambahkan komisi langsung ke balance.
  const result = await db.execute<{
    member_id: string;
    level: Level;
    final_amount: string;
    new_balance: string;
    completed_count: number;
  }>(sql`
    WITH
      m AS (
        SELECT id, level, balance, frozen_balance
        FROM profiles
        WHERE id = ${row.member_id}
        FOR UPDATE
      ),
      fin AS (
        SELECT
          m.id AS member_id,
          (${row.commission}::numeric * CASE m.level
            WHEN 'classic' THEN 1.0
            WHEN 'silver' THEN 1.25
            WHEN 'gold' THEN 1.5
            WHEN 'platinum' THEN 1.75
            WHEN 'diamond' THEN 2.0
            WHEN 'premier' THEN 2.5
          END) AS final_amount
        FROM m
      ),
      cnt AS (
        SELECT member_id, COUNT(*)::int AS total_done
        FROM tasks
        WHERE member_id = ${row.member_id} AND status = 'selesai'::task_status
        GROUP BY member_id
      ),
      new_lvl AS (
        SELECT
          cnt.member_id,
          CASE
            WHEN cnt.total_done >= 100 THEN 'premier'::user_level
            WHEN cnt.total_done >= 50 THEN 'diamond'::user_level
            WHEN cnt.total_done >= 30 THEN 'platinum'::user_level
            WHEN cnt.total_done >= 15 THEN 'gold'::user_level
            WHEN cnt.total_done >= 5 THEN 'silver'::user_level
            ELSE 'classic'::user_level
          END AS lvl
        FROM cnt
      ),
      credit AS (
        UPDATE profiles
        SET balance = balance + (SELECT final_amount FROM fin),
            frozen_balance = CASE
              WHEN ${row.prev_status}::text = 'dikerjakan'
              THEN GREATEST(frozen_balance - (SELECT final_amount FROM fin), 0)
              ELSE frozen_balance
            END,
            level = COALESCE((SELECT lvl FROM new_lvl), profiles.level),
            updated_at = now()
        WHERE id = ${row.member_id}
        RETURNING profiles.id, profiles.balance, profiles.level
      )
    SELECT
      credit.id AS member_id,
      credit.level,
      (SELECT final_amount FROM fin)::text AS final_amount,
      credit.balance::text AS new_balance,
      COALESCE((SELECT total_done FROM cnt), 0) AS completed_count
    FROM credit
  `);

  if (result.length === 0) {
    return { error: "Gagal mengkredit komisi." };
  }

  const r = result[0];

  // 3. Audit log
  const fromFrozen = row.prev_status === "dikerjakan";
  await db.insert(auditLogs).values({
    actorId: actorId,
    targetId: r.member_id,
    action: "task_completed",
    amount: r.final_amount,
    note: fromFrozen
      ? `Tugas #${taskId} selesai. Komisi dipindahkan dari saldo beku ke saldo utama.`
      : `Tugas #${taskId} selesai.`,
    metadata: JSON.stringify({
      taskId,
      from: row.prev_status,
      to: "selesai",
      finalAmount: r.final_amount,
      fromFrozen,
      completedCount: r.completed_count,
      newLevel: r.level,
    }),
  });

  revalidatePath("/admin/task");
  revalidatePath("/admin/users");
  revalidatePath("/profil");
  revalidatePath("/order");
  return {
    success: true,
    message: fromFrozen
      ? `Tugas #${taskId} disetujui. Saldo beku dipindahkan ke saldo. Level: ${r.level}.`
      : `Tugas #${taskId} selesai. Komisi Rp ${Number(r.final_amount).toLocaleString("id-ID")} dikredit. Level: ${r.level} (${r.completed_count} tugas).`,
  };
}

// ===== Create task (admin assigns task to a member) =====

const createTaskSchema = z.object({
  memberId: z.string().uuid("ID anggota tidak valid."),
  productId: z.coerce
    .number({ message: "Pilih produk." })
    .int()
    .positive("Produk tidak valid."),
  price: z.coerce
    .number({ message: "Harga wajib diisi." })
    .positive("Harga harus lebih dari 0.")
    .max(100_000_000, "Harga maksimal Rp 100.000.000."),
});

export async function createTask(
  _prev: TaskReviewState,
  formData: FormData,
): Promise<TaskReviewState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = createTaskSchema.safeParse({
    memberId: formData.get("memberId"),
    productId: formData.get("productId"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Validasi scope: admin hanya boleh kasih tugas ke member di timnya
  try {
    await assertScopeForMember(parsed.data.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  // Validasi member: harus role 'member' dan tidak 'banned'
  const [member] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      level: profiles.level,
      status: profiles.status,
    })
    .from(profiles)
    .where(eq(profiles.id, parsed.data.memberId))
    .limit(1);
  if (!member) return { error: "Anggota tidak ditemukan." };
  if (member.role !== "member") {
    return { error: "Tugas hanya bisa diberikan ke anggota (member)." };
  }
  if (member.status === "banned") {
    return { error: "Anggota ini sedang diblokir. Buka blokir terlebih dahulu." };
  }

  // Validasi produk: harus aktif
  const [product] = await db
    .select({ id: products.id, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, parsed.data.productId))
    .limit(1);
  if (!product) return { error: "Produk tidak ditemukan." };
  if (!product.isActive) {
    return { error: "Produk ini tidak aktif, tidak bisa diberikan." };
  }

  // Hitung komisi berdasar level member saat ini (rate % dari price)
  const ratePercent = await getCommissionRate(member.level as Level);
  const commission = (parsed.data.price * ratePercent) / 100;
  const priceStr = parsed.data.price.toFixed(2);
  const commissionStr = commission.toFixed(2);

  const [created] = await db
    .insert(tasks)
    .values({
      memberId: parsed.data.memberId,
      productId: parsed.data.productId,
      price: priceStr,
      commission: commissionStr,
      status: "dipilih",
    })
    .returning({ id: tasks.id });

  if (!created) return { error: "Gagal membuat tugas." };

  await db.delete(taskRequests).where(eq(taskRequests.memberId, parsed.data.memberId));

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: parsed.data.memberId,
    action: "create_task",
    amount: priceStr,
    note: `Tugas #${created.id} diberikan (komisi Rp ${Number(commissionStr).toLocaleString("id-ID")} @${ratePercent}%).`,
    metadata: JSON.stringify({
      taskId: created.id,
      productId: parsed.data.productId,
      price: parsed.data.price,
      commission: commission,
      level: member.level,
    }),
  });

  revalidatePath("/admin/task");
  revalidatePath("/order");
  revalidatePath("/task");
  return {
    success: true,
    message: `Tugas #${created.id} berhasil diberikan.`,
  };
}

// ===== Assign product to a pending task (admin selects product for member's request) =====

const assignProductSchema = z.object({
  taskId: z.coerce.number().int().positive("ID tugas tidak valid."),
  productId: z.coerce
    .number({ message: "Pilih produk." })
    .int()
    .positive("Produk tidak valid."),
  price: z.coerce
    .number({ message: "Harga wajib diisi." })
    .positive("Harga harus lebih dari 0.")
    .max(100_000_000, "Harga maksimal Rp 100.000.000."),
});

export type AssignProductState = TaskReviewState & { taskId?: number };

export async function assignProduct(
  _prev: AssignProductState,
  formData: FormData,
): Promise<AssignProductState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = assignProductSchema.safeParse({
    taskId: formData.get("taskId"),
    productId: formData.get("productId"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Ambil request aktif member yang akan diproses admin.
  const [requestRow] = await db
    .select({
      id: taskRequests.id,
      memberId: taskRequests.memberId,
    })
    .from(taskRequests)
    .where(eq(taskRequests.id, parsed.data.taskId))
    .limit(1);
  if (!requestRow) return { error: "Request tugas tidak ditemukan." };

  // Validasi scope: admin hanya boleh assign untuk member di timnya
  try {
    await assertScopeForMember(requestRow.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  // Validasi member: harus role 'member' dan tidak 'banned'
  const [member] = await db
    .select({ level: profiles.level, status: profiles.status })
    .from(profiles)
    .where(eq(profiles.id, requestRow.memberId))
    .limit(1);
  if (!member) return { error: "Anggota tidak ditemukan." };
  if (member.status === "banned") {
    return { error: "Anggota ini sedang diblokir. Buka blokir terlebih dahulu." };
  }

  // Validasi produk: harus aktif
  const [product] = await db
    .select({ id: products.id, isActive: products.isActive })
    .from(products)
    .where(eq(products.id, parsed.data.productId))
    .limit(1);
  if (!product) return { error: "Produk tidak ditemukan." };
  if (!product.isActive) {
    return { error: "Produk ini tidak aktif, tidak bisa dipilih." };
  }

  // Hitung komisi berdasar level member saat ini
  const ratePercent = await getCommissionRate(member.level as Level);
  const commission = (parsed.data.price * ratePercent) / 100;
  const priceStr = parsed.data.price.toFixed(2);
  const commissionStr = commission.toFixed(2);

  const [createdTask] = await db
    .insert(tasks)
    .values({
      memberId: requestRow.memberId,
      productId: parsed.data.productId,
      price: priceStr,
      commission: commissionStr,
      status: "dipilih",
    })
    .returning({ id: tasks.id });

  if (!createdTask) return { error: "Gagal membuat tugas dari request." };

  await db.delete(taskRequests).where(eq(taskRequests.id, requestRow.id));

  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: requestRow.memberId,
    action: "task_product_assigned",
    amount: priceStr,
    note: `Request #${parsed.data.taskId} dipilih menjadi tugas #${createdTask.id} dengan produk #${parsed.data.productId} (komisi Rp ${Number(commissionStr).toLocaleString("id-ID")} @${ratePercent}%).`,
    metadata: JSON.stringify({
      requestId: parsed.data.taskId,
      taskId: createdTask.id,
      productId: parsed.data.productId,
      price: parsed.data.price,
      commission,
      level: member.level,
    }),
  });

  revalidatePath("/admin/task");
  revalidatePath("/order");
  revalidatePath("/task");
  return {
    success: true,
    message: `Produk berhasil dipilih untuk request #${parsed.data.taskId}.`,
    taskId: createdTask.id,
  };
}
