import React from "react";
import { SimulationBanner } from "@/components/layout/SimulationBanner";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 transition-colors">
        <SimulationBanner />
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
      );
}
