import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (pathname.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 sm:pl-60">
      {children}
    </div>
  );
}
