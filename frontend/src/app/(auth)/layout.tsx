import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 transition-colors">
      <PublicHeader />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

