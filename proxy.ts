import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Pakai getSession() (baca dari cookie, tanpa HTTP call) untuk routing
  // decision. getUser() di sini akan trigger HTTP call ke Supabase Auth
  // setiap request, yang pada Vercel cold start bisa timeout dan
  // menyebabkan user dianggap logout padahal cookie masih valid.
  // Validasi JWT penuh tetap dilakukan oleh getUser() di server pages
  // dan server actions yang membaca data sensitif.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { pathname } = request.nextUrl;

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
    const role = (user.user_metadata as { role?: string } | undefined)
      ?.role;
    if (role !== "member") {
      const url = request.nextUrl.clone();
      url.pathname = role ? "/admin/dashboard" : "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Sudah login & membuka halaman login/register → lempar ke profil
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/profil";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
