"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/hooks/use-session";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const isAdmin = role === "superadmin" || role === "analyst" || role === "admin";
    if (pathname.startsWith("/admin") && !isAdmin) {
      router.replace("/sme");
    }
  }, [mounted, user, role, isLoading, pathname, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1D5FAE] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sesi pengguna tidak ditemukan atau telah kedaluwarsa.
        </p>
        <a
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="rounded-lg bg-[#1D5FAE] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184e91]"
        >
          Masuk ke Akun
        </a>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
