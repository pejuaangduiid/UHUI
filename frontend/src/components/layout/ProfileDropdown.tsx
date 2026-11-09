"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, TrendingUp, ChevronDown, Wallet } from "lucide-react";
import { formatIDR } from "@/lib/money";
import { useWallet } from "@/hooks/use-wallet";
import { TopUpModal } from "@/components/domain/wallet/TopUpModal";
import type { components } from "@/types/api";

type User = components["schemas"]["UserDTO"];

interface ProfileDropdownProps {
  user: User;
  role?: string;
  dashboardHref: string;
  onLogout: () => void;
}

export function ProfileDropdown({
  user,
  role,
  dashboardHref,
  onLogout,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { balance } = useWallet();
  const ref = useRef<HTMLDivElement>(null);

  const roleLabel =
    role === "investor" ? "Investor" : role === "admin" || role === "superadmin" ? "Admin" : "UMKM";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menu profil pengguna"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 p-1 pl-1.5 pr-2 shadow-sm transition hover:bg-slate-100 dark:border-white/10 dark:bg-[#121827]/80 dark:hover:bg-slate-800"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
          {user.full_name?.charAt(0).toUpperCase() || "U"}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur-md dark:border-white/[0.08] dark:bg-[#121827]/95 z-50">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] mb-1">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user.full_name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="rounded bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                {roleLabel}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {user.email}
              </span>
            </div>
          </div>

          <div className="mx-1 my-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Wallet className="h-3 w-3 text-blue-500" />
                Saldo UHUI
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setTopUpOpen(true);
                }}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Top Up
              </button>
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatIDR(balance)}
            </div>
          </div>

          <div className="space-y-0.5">
            <Link
              href={dashboardHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60 transition"
            >
              <LayoutDashboard className="h-4 w-4 text-blue-500" />
              <span>Buka Dashboard</span>
            </Link>

            <Link
              href="/invest"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60 transition"
            >
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <span>Bursa &amp; Saham Saya</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 dark:border-white/[0.06] mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}
