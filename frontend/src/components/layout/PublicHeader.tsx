"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileDropdown } from "./ProfileDropdown";
import { useSession } from "@/hooks/use-session";
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, Store } from "lucide-react";

const NAV_LINKS = [
  { href: "/bursa", label: "Bursa Saham" },
  { href: "/komunitas", label: "Komunitas" },
  { href: "/kursus", label: "Kursus & Webinar" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading, user, role, logout } = useSession();

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const roleLabel = role === "investor" ? "Investor" : role === "admin" || role === "superadmin" ? "Admin" : "Mitra UMKM";
  const dashboardHref = role === "investor" ? "/invest" : role === "admin" || role === "superadmin" ? "/admin" : "/sme";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E7EB] bg-[#FAF9F6]/90 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#0D1C2C]/90 transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Logo.jpeg"
                alt="UHUI - UMKM Hub Indonesia"
                width={140}
                height={50}
                className="h-10 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-xs"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive(item.href)
                    ? "text-[#1D5FAE] dark:text-blue-400 bg-[#DFE9F1]/80 dark:bg-blue-950/50 shadow-xs"
                    : "text-[#516072] dark:text-slate-300 hover:text-[#0F1E2E] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {isLoading ? (
            <div className="hidden sm:block h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1D5FAE] bg-[#DFE9F1] dark:bg-blue-950/60 dark:text-blue-300 hover:opacity-90 transition"
              >
                <Store className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <ProfileDropdown user={user} role={role} dashboardHref={dashboardHref} onLogout={logout} />
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <Link href="/login" className="text-xs font-semibold text-[#0F1E2E] dark:text-slate-200 hover:text-[#1D5FAE] dark:hover:text-white px-3 py-2 transition">Masuk</Link>
              <Link href="/register" className="text-xs font-semibold bg-[#1D5FAE] hover:bg-[#184e91] text-white px-4 py-2 rounded-[11px] shadow-sm active:scale-[0.985] transition-all">Mulai Sekarang</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-[#516072] dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2E7EB] dark:border-white/[0.08] bg-[#FAF9F6]/98 dark:bg-[#0D1C2C]/98 backdrop-blur-md px-6 py-4 space-y-3">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${isActive(item.href) ? "font-semibold text-[#1D5FAE] dark:text-blue-400 bg-[#DFE9F1] dark:bg-blue-950/40" : "text-[#516072] dark:text-slate-300"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#E2E7EB] dark:border-white/[0.08] flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center justify-between py-1 text-xs">
                  <span className="font-semibold text-[#0F1E2E] dark:text-white">{user.full_name}</span>
                  <span className="text-[10px] bg-[#DFE9F1] dark:bg-blue-950 text-[#1D5FAE] dark:text-blue-300 px-2 py-0.5 rounded font-semibold">{roleLabel}</span>
                </div>
                <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl bg-[#1D5FAE] text-white shadow-sm">
                  <LayoutDashboard className="h-4 w-4" /> Buka Dashboard
                </Link>
                <button type="button" onClick={() => logout()} className="flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-xl text-[#BA1A1A] hover:bg-red-50 dark:hover:bg-red-950/20">
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-semibold text-center text-[#0F1E2E] dark:text-slate-200">Masuk</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-[11px] bg-[#1D5FAE] text-white shadow-sm">
                  Mulai Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
