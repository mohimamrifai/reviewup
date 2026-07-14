"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-sm sm:max-w-md sm:p-9"
      >
        <div className="mb-5 flex justify-center sm:mb-8">
          <Image
            src="/logo.webp"
            alt="ReviewUp"
            width={88}
            height={88}
            priority
            className="sm:hidden"
          />
          <Image
            src="/logo.webp"
            alt="ReviewUp"
            width={112}
            height={112}
            priority
            className="hidden sm:block"
          />
        </div>

        <div className="space-y-2.5 sm:space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Nama Pengguna"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base"
          />
          <input
            type="password"
            name="password"
            placeholder="Kata Sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base"
          />
        </div>

        <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 active:brightness-90 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            Masuk
          </button>
          <Link
            href="/register"
            className="block w-full rounded-xl border-2 border-brand bg-card px-4 py-2 text-center text-sm font-semibold text-brand transition hover:bg-brand/5 active:bg-brand/10 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            Daftar sekarang
          </Link>
        </div>
      </form>
    </div>
  );
}
