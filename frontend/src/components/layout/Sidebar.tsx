"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

interface SidebarProps {
  onLogout: () => void;
  userRole?: string;
}

export function Sidebar({ onLogout, userRole }: SidebarProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const isAdminRole = userRole === "admin" || userRole === "superadmin";
  const isInAdminMode = pathname.startsWith("/admin");

  const smeLinks = [
    { href: "/sme", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/sme/bisnis", label: "Bisnis Saya", icon: Building2 },
    { href: "/sme/kasir", label: "Kasir (POS)", icon: ShoppingCart },
    { href: "/invest", label: "Bursa Saham", icon: TrendingUp },
    { href: "/sme/kursus", label: "Kursus & Webinar", icon: GraduationCap },
  ];

  const adminLinks = [
    { href: "/admin", label: "Pusat Kendali", icon: LayoutDashboard },
    { href: "/admin/bisnis", label: "Bisnis & Bursa", icon: Building2 },
    { href: "/admin/kursus", label: "Kelola Kursus", icon: GraduationCap },
    { href: "/admin/komunitas", label: "Moderasi Komunitas", icon: MessageSquare },
    { href: "/admin/verifikasi", label: "Kurasi Dokumen", icon: ShieldCheck },
  ];

  const links = isInAdminMode ? adminLinks : smeLinks;

  const checkActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/sme") return pathname === "/sme";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden flex-col border-r border-[#E2E7EB] bg-[#F4F3F1] text-[#0F1E2E] dark:border-white/[0.08] dark:bg-[#0A1624] dark:text-[#FAF9F6] transition-all duration-300 lg:flex h-screen shrink-0 ${isSidebarCollapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-[#E2E7EB] px-4 dark:border-white/[0.08]">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <Image
              src="/Logo.jpeg"
              alt="UHUI Logo"
              width={130}
              height={45}
              className="h-9 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-xs"
              priority
            />
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#DFE9F1] dark:bg-white/10 text-[#00478C] dark:text-blue-300">
              {isInAdminMode ? "Admin" : "UMKM"}
            </span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs p-0.5">
            <Image src="/Logo.jpeg" alt="UHUI" width={32} height={32} className="h-full w-full object-contain" />
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Perluas menu" : "Ciutkan menu"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#516072] hover:bg-[#E9E8E5] hover:text-[#0F1E2E] dark:hover:bg-white/[0.06] dark:hover:text-white transition"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav aria-label="Menu samping" className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = checkActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              title={isSidebarCollapsed ? link.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                ? "bg-[#1D5FAE] text-white shadow-xs font-bold"
                : "text-[#516072] hover:bg-[#E9E8E5] hover:text-[#0F1E2E] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                } ${isSidebarCollapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!isSidebarCollapsed && (
          <div className="p-3 border-t border-[#E2E7EB] dark:border-white/[0.08] space-y-2">
            {isAdminRole && (
              <Link
                href={isInAdminMode ? "/sme" : "/admin"}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-[#E2E7EB] dark:border-white/10 bg-white dark:bg-[#132235] text-xs font-semibold text-[#0F1E2E] dark:text-white hover:bg-[#F4F3F1] dark:hover:bg-white/5 transition"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#1D5FAE]" />
                <span>{isInAdminMode ? "Ke Workspace UMKM" : "Ke Panel Admin"}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#BA1A1A] hover:bg-red-50 dark:hover:bg-red-950/20 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        )}
    </aside>
  );
}
