import { and, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import { deposits, profiles, withdrawals } from "@/lib/db/schema";
import { parseLocalDateInput } from "@/lib/date-range";
import type { Scope } from "@/lib/access";

export type DateRange = {
  from: Date;
  to: Date;
};

export type DashboardStats = {
  totalMembers: number;
  rangeRegistrations: number;
  rangeDepositRequests: number;
  rangeDepositAmount: number;
  rangeWithdrawalAmount: number;
  rangeProfit: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
};

const EMPTY_STATS: DashboardStats = {
  totalMembers: 0,
  rangeRegistrations: 0,
  rangeDepositRequests: 0,
  rangeDepositAmount: 0,
  rangeWithdrawalAmount: 0,
  rangeProfit: 0,
  totalDepositAmount: 0,
  totalWithdrawalAmount: 0,
};

function getTodayRange(): DateRange {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  const to = new Date();
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export function parseDateRange(
  from: string | undefined,
  to: string | undefined,
): DateRange | null {
  if (!from || !to) return null;
  const fromDate = parseLocalDateInput(from);
  const toDate = parseLocalDateInput(to, true);
  if (!fromDate || !toDate) return null;
  if (fromDate > toDate) return null;
  return { from: fromDate, to: toDate };
}

// Filter helper: jika admin punya scope terbatas, tambahkan inArray(memberId, ...).
// Kalau unrestricted (super_admin) atau scope null, return undefined (no filter).
function scopeFilter(
  scope: Scope | null,
  col: AnyPgColumn,
): SQL | undefined {
  if (!scope || scope.unrestricted) return undefined;
  if (scope.memberIds === null) return undefined; // safety
  return inArray(col, scope.memberIds);
}

/**
 * Ambil statistik dashboard dengan filter sesuai scope admin.
 *
 * - super_admin / scope.unrestricted: global (semua member)
 * - admin_leader: hanya member yang ada di staff-staf di bawahnya
 * - admin_staff: hanya member yang ia referensikan langsung
 *
 * `totalMembers` dihitung sebagai jumlah member dalam scope (bukan global),
 * supaya tiap admin lihat angka yang relevan dengan akunnya.
 */
export async function getDashboardStats(
  range: DateRange | null,
  scope: Scope | null,
): Promise<DashboardStats> {
  // Jika scope dibatasi tapi tidak ada member sama sekali → langsung nol.
  if (scope && !scope.unrestricted && scope.memberIds !== null) {
    if (scope.memberIds.length === 0) {
      return { ...EMPTY_STATS };
    }
  }

  const memberFilter = scopeFilter(scope, profiles.id);
  const depositMemberFilter = scopeFilter(scope, deposits.memberId);
  const withdrawalMemberFilter = scopeFilter(scope, withdrawals.memberId);
  const activityRange = range ?? getTodayRange();

  const inRange = (col: AnyPgColumn): SQL | undefined =>
    and(gte(col, activityRange.from), lte(col, activityRange.to));

  // Total member dalam scope (selalu, tidak tergantung range)
  const [memberRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(profiles)
    .where(
      and(
        eq(profiles.role, "member"),
        memberFilter,
      ),
    );
  const totalMembers = memberRow?.count ?? 0;

  const [
    regRows,
    depReqRows,
    depApprovedRows,
    wdCompletedRows,
    totalDepRows,
    totalWdRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(profiles)
      .where(
        and(
          eq(profiles.role, "member"),
          inRange(profiles.createdAt),
          memberFilter,
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(deposits)
      .where(and(inRange(deposits.createdAt), depositMemberFilter)),
    db
      .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits)
      .where(
        and(
          eq(deposits.status, "approved"),
          inRange(deposits.createdAt),
          depositMemberFilter,
        ),
      ),
    db
      .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.status, "completed"),
          inRange(withdrawals.createdAt),
          withdrawalMemberFilter,
        ),
      ),
    db
      .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits)
      .where(
        and(
          eq(deposits.status, "approved"),
          range ? inRange(deposits.createdAt) : undefined,
          depositMemberFilter,
        ),
      ),
    db
      .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.status, "completed"),
          range ? inRange(withdrawals.createdAt) : undefined,
          withdrawalMemberFilter,
        ),
      ),
  ]);

  const [regRow] = regRows;
  const [depReqRow] = depReqRows;
  const [depApprovedRow] = depApprovedRows;
  const [wdCompletedRow] = wdCompletedRows;
  const [totalDepRow] = totalDepRows;
  const [totalWdRow] = totalWdRows;

  const rangeDeposit = Number(depApprovedRow?.total ?? 0);
  const rangeWithdrawal = Number(wdCompletedRow?.total ?? 0);
  return {
    totalMembers,
    rangeRegistrations: regRow?.count ?? 0,
    rangeDepositRequests: depReqRow?.count ?? 0,
    rangeDepositAmount: rangeDeposit,
    rangeWithdrawalAmount: rangeWithdrawal,
    rangeProfit: Math.max(0, rangeDeposit - rangeWithdrawal),
    totalDepositAmount: Number(totalDepRow?.total ?? 0),
    totalWithdrawalAmount: Number(totalWdRow?.total ?? 0),
  };
}
