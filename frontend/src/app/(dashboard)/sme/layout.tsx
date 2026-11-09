"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BusinessContextBar } from "@/components/domain/sme/BusinessContextBar";

export default function SmeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isExcluded =
    pathname === "/sme" ||
    pathname === "/sme/bisnis" ||
    pathname.startsWith("/sme/bisnis/") ||
    pathname.startsWith("/sme/kursus");

  return (
    <div className="space-y-5">
      {!isExcluded && <BusinessContextBar />}
      {children}
    </div>
  );
}
