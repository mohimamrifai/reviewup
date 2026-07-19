/**
 * Helper untuk menentukan scope akses admin berdasarkan role.
 *
 * Aturan:
 * - `super_admin`  : full akses (semua member, semua admin)
 * - `admin_leader` : aggregate member dari staff-staf di bawahnya (`leader_id` = leader.id)
 * - `admin_staff`  : member yang direct referral ke staff (`referred_by` = staff.id)
 * - `member`       : tidak applicable (dipakai untuk cek akses)
 *
 * Super Admin juga dapat menyetel `access_overrides` JSON pada profil admin
 * untuk memberikan/mencabut kemampuan tertentu (lihat `AccessOverrides`).
 */

import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export type AdminRole = "super_admin" | "admin_leader" | "admin_staff" | "member";

/**
 * Override flag yang dapat disetel Super Admin per-admin di `access_overrides`.
 */
export type AccessOverrides = {
  fullAccess?: boolean;
  canCreateStaff?: boolean;
  canCreateLeader?: boolean;
  commissionEdit?: boolean;
  depositBankCrud?: boolean;
  channelCrud?: boolean;
};

export type Scope = {
  /** ID admin yang login (atau null jika unauthenticated). */
  actorId: string;
  role: AdminRole;
  /**
   * Daftar UUID profile yang boleh diakses actor ini.
   * Untuk super_admin: tidak terisi (NULL = unrestricted, lihat `unrestricted`).
   * Untuk admin_leader: semua member di bawah staff-stafnya.
   * Untuk admin_staff: member yang direct referral.
   * Untuk member: hanya dirinya sendiri.
   */
  memberIds: string[] | null;
  /**
   * Jika true, actor boleh akses semua member tanpa filter.
   * (Hanya super_admin yang punya flag ini, atau override `fullAccess`.)
   */
  unrestricted: boolean;
  /** Override flag (lihat `AccessOverrides`). */
  overrides: AccessOverrides;
};

/**
 * Baca AccessOverrides dari row profile (aman jika null/undefined).
 */
function readOverrides(raw: unknown): AccessOverrides {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    fullAccess: obj.fullAccess === true,
    canCreateStaff: obj.canCreateStaff === true,
    canCreateLeader: obj.canCreateLeader === true,
    commissionEdit: obj.commissionEdit === true,
    depositBankCrud: obj.depositBankCrud === true,
    channelCrud: obj.channelCrud === true,
  };
}

/**
 * Ambil scope akses untuk user yang sedang login.
 * Mengembalikan null jika user tidak ditemukan.
 */
export async function getScope(userId: string | null): Promise<Scope | null> {
  if (!userId) return null;

  const [profile] = await db
    .select({
      id: profiles.id,
      role: profiles.role,
      accessOverrides: profiles.accessOverrides,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) return null;

  const role = profile.role as AdminRole;
  const overrides = readOverrides(profile.accessOverrides);

  if (role === "super_admin") {
    return {
      actorId: profile.id,
      role,
      memberIds: null,
      unrestricted: true,
      overrides,
    };
  }

  if (role === "admin_staff") {
    const members = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.referredBy, profile.id));
    return {
      actorId: profile.id,
      role,
      memberIds: members.map((m) => m.id),
      unrestricted: overrides.fullAccess === true,
      overrides,
    };
  }

  if (role === "admin_leader") {
    // Aggregate: member yang referred_by = staff dengan leader_id = leader.id
    const staffRows = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.leaderId, profile.id));

    const staffIds = staffRows.map((s) => s.id);
    if (staffIds.length === 0) {
      return {
        actorId: profile.id,
        role,
        memberIds: [],
        unrestricted: overrides.fullAccess === true,
        overrides,
      };
    }
    const members = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(inArray(profiles.referredBy, staffIds));
    return {
      actorId: profile.id,
      role,
      memberIds: members.map((m) => m.id),
      unrestricted: overrides.fullAccess === true,
      overrides,
    };
  }

  // member
  return {
    actorId: profile.id,
    role,
    memberIds: [profile.id],
    unrestricted: false,
    overrides,
  };
}

/**
 * Cek apakah actor boleh mengakses target member.
 * Return true kalau target termasuk dalam scope, atau actor unrestricted.
 */
export function canAccessMember(
  scope: Scope,
  targetMemberId: string,
): boolean {
  if (scope.unrestricted) return true;
  if (scope.memberIds === null) return false; // safety: tidak ada unrestricted eksplisit
  return scope.memberIds.includes(targetMemberId);
}

/**
 * Throw error kalau scope tidak boleh akses target member.
 * Dipakai di server action sebelum mutate data member.
 */
export function assertCanAccessMember(
  scope: Scope,
  targetMemberId: string,
): void {
  if (!canAccessMember(scope, targetMemberId)) {
    throw new Error("FORBIDDEN_SCOPE");
  }
}
