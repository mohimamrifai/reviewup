import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const MEMBER_PREFIXES = [
  "/profil",
  "/recharge",
  "/withdraw",
  "/bank",
  "/task",
  "/order",
  "/support",
];

const ADMIN_PREFIXES = ["/admin"];
const ADMIN_PUBLIC = ["/admin/login"];
const INTERNAL_USER_HEADER = "x-reviewup-user";
const INTERNAL_PROFILE_HEADER = "x-reviewup-profile";

function encodeInternalHeader(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAdminPublic(pathname: string) {
  return ADMIN_PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const user = session?.user ?? null;
  if (user) {
    requestHeaders.set(INTERNAL_USER_HEADER, encodeInternalHeader(user));
  } else {
    requestHeaders.delete(INTERNAL_USER_HEADER);
  }
  const { pathname } = request.nextUrl;
  const needsRoleCheck =
    !!user &&
    (startsWithAny(pathname, MEMBER_PREFIXES) ||
      startsWithAny(pathname, ADMIN_PREFIXES) ||
      pathname === "/login" ||
      pathname === "/register");

  let role = (user as { role?: string } | null)?.role ?? null;
  if (needsRoleCheck && user) {
    const [profile] = await db
      .select({
        id: profiles.id,
        role: profiles.role,
        accessOverrides: profiles.accessOverrides,
        referredBy: profiles.referredBy,
        leaderId: profiles.leaderId,
        username: profiles.username,
        status: profiles.status,
        level: profiles.level,
        referralCode: profiles.referralCode,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    role = profile?.role ?? role ?? null;
    if (profile) {
      requestHeaders.set(INTERNAL_PROFILE_HEADER, encodeInternalHeader(profile));
    } else {
      requestHeaders.delete(INTERNAL_PROFILE_HEADER);
    }
  }
  if (!needsRoleCheck || !user) {
    requestHeaders.delete(INTERNAL_PROFILE_HEADER);
  }

  // Halaman admin: wajib login, kecuali /admin/login
  if (startsWithAny(pathname, ADMIN_PREFIXES) && !isAdminPublic(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Halaman member: wajib login sebagai role member
  if (startsWithAny(pathname, MEMBER_PREFIXES)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Non-member (admin_staff / admin_leader / super_admin) yang akses
    // halaman member akan dilempar ke dashboard admin. Role di-set di
    // user_metadata saat signup (lihat lib/actions/auth.ts & admin-users.ts).
    if (role !== "member") {
      const url = request.nextUrl.clone();
      url.pathname = role ? "/admin/dashboard" : "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Sudah login & membuka halaman login/register → lempar ke profil
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = role === "member" ? "/profil" : "/admin/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
