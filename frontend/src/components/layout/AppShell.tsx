"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileDropdown } from "./ProfileDropdown";
import { WalletBadge } from "@/components/domain/wallet/WalletBadge";
import { useSession } from "@/hooks/use-session";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { user, role, logout } = useSession();

  const handleQuickAction = () => {
    router.push("/sme/kasir");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F6] text-[#0F1E2E] dark:bg-[#0D1C2C] dark:text-[#FAF9F6] transition-colors">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-[#1D5FAE] focus:px-4 focus:py-2 focus:text-white">
        Lewati ke konten utama
      </a>
      <Sidebar onLogout={logout} userRole={role} />
      <div className="flex flex-1 flex-col h-screen overflow-hidden pb-16 lg:pb-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E2E7EB] bg-[#FAF9F6]/90 px-4 sm:px-6 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#0D1C2C]/90 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center">
              <Image
                src="/Logo.jpeg"
                alt="UHUI Logo"
                width={120}
                height={45}
                className="h-8 w-auto object-contain rounded-md bg-white px-1 py-0.5 shadow-xs"
                priority
              />
            </div>
            <div className="relative hidden md:flex items-center">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#516072] dark:text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi, pembukuan, modul..."
                className="w-64 lg:w-80 rounded-xl border border-[#E2E7EB] bg-white py-1.5 pl-9 pr-12 text-xs text-[#0F1E2E] outline-none transition focus:border-[#1D5FAE] focus:ring-1 focus:ring-[#1D5FAE] dark:border-white/[0.08] dark:bg-[#132235] dark:text-slate-200"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#EFEEEB] dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-[#516072] dark:text-slate-300 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <WalletBadge />
            <ThemeToggle />
            {user ? (
              <ProfileDropdown user={user} role={role} dashboardHref={role === "investor" ? "/invest" : "/sme"} onLogout={logout} />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            )}
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNav onQuickAction={handleQuickAction} />
    </div>
  );
}
