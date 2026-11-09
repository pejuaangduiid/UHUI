"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Plus, ShoppingCart, TrendingUp } from "lucide-react";

interface BottomNavProps {
  onQuickAction?: () => void;
}

export function BottomNav({ onQuickAction }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/sme", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/sme/bisnis", label: "Bisnis", icon: Building2 },
    { href: "/sme/kasir", label: "Kasir", icon: ShoppingCart },
    { href: "/invest", label: "Bursa", icon: TrendingUp },
  ];

  const checkActive = (href: string) => {
    if (href === "/sme") return pathname === "/sme";
    if (href === "/sme/kasir") return pathname.startsWith("/sme/kasir");
    if (href === "/sme/bisnis") return pathname.startsWith("/sme/bisnis");
    if (href === "/invest") return pathname.startsWith("/invest") || pathname.startsWith("/bursa");
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-medium transition-colors ${isActive
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[11px]">{item.label}</span>
            </Link>
          );
        })}

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onQuickAction}
            aria-label="Catat Transaksi atau Foto Nota"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform active:scale-95 hover:bg-blue-500"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = checkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-xs font-medium transition-colors ${isActive
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[11px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
