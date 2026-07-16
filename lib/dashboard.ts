import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import { deposits, profiles, withdrawals } from "@/lib/db/schema";

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

export function parseDateRange(
  from: string | undefined,
  to: string | undefined,
): DateRange | null {
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null;
  }
  // Normalisasi to-date ke akhir hari (23:59:59)
  toDate.setHours(23, 59, 59, 999);
  fromDate.setHours(0, 0, 0, 0);
  if (fromDate > toDate) return null;
  return { from: fromDate, to: toDate };
}

export async function getDashboardStats(
  range: DateRange | null,
): Promise<DashboardStats> {
  // Total member sepanjang waktu (selalu)
  const [memberRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(profiles)
    .where(eq(profiles.role, "member"));
  const totalMembers = memberRow?.count ?? 0;

  if (!range) {
    // Mode "Sepanjang Waktu" - tampilkan total keseluruhan
    const [depRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits)
      .where(eq(deposits.status, "approved"));
    const [wdRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals)
      .where(eq(withdrawals.status, "completed"));

    const totalDeposit = Number(depRow?.total ?? 0);
    const totalWithdrawal = Number(wdRow?.total ?? 0);

    return {
      ...EMPTY_STATS,
      totalMembers,
      totalDepositAmount: totalDeposit,
      totalWithdrawalAmount: totalWithdrawal,
    };
  }

  // Mode dengan rentang tanggal
  const inRange = (col: AnyPgColumn): SQL | undefined =>
    and(gte(col, range.from), lte(col, range.to));

  const [regRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(profiles)
    .where(
      and(eq(profiles.role, "member"), inRange(profiles.createdAt)),
    );

  const [depReqRow] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(deposits)
    .where(inRange(deposits.createdAt));

  const [depApprovedRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
    .from(deposits)
    .where(
      and(eq(deposits.status, "approved"), inRange(deposits.createdAt)),
    );

  const [wdCompletedRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.status, "completed"),
        inRange(withdrawals.createdAt),
      ),
    );

  const [totalDepRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
    .from(deposits)
    .where(eq(deposits.status, "approved"));

  const [totalWdRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
    .from(withdrawals)
    .where(eq(withdrawals.status, "completed"));

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
