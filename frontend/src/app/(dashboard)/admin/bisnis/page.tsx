"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, TrendingUp } from "lucide-react";
import { useAdminSMEs, useAdminCampaigns } from "@/hooks/use-admin-sme-bursa";
import { AdminSMETable } from "@/components/admin/AdminSMETable";
import { AdminCampaignTable } from "@/components/admin/AdminCampaignTable";

export default function AdminBisnisBursaPage() {
  const [activeTab, setActiveTab] = useState<"sme" | "bursa">("sme");
  const { smes, isLoading: isSmeLoading, setSMESuspension } = useAdminSMEs();
  const { campaigns, isLoading: isCampLoading, setCampaignSuspension } = useAdminCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#1D5FAE] mb-1 transition">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Ringkasan Superadmin</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Pengawasan Bisnis UMKM &amp; Bursa Saham
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kendalikan status operasional dan penangguhan bisnis atau kampanye yang melanggar aturan.
            </p>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#121827]">
          <button
            type="button"
            onClick={() => setActiveTab("sme")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "sme"
                  ? "bg-[#1D5FAE] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Daftar Bisnis UMKM ({smes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bursa")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "bursa"
                  ? "bg-[#1D5FAE] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Kampanye Bursa Saham ({campaigns.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "sme" ? (
        <AdminSMETable
          items={smes}
          isLoading={setSMESuspension.isPending || isSmeLoading}
          onToggleSuspend={async (id, isSuspended, reason) => {
            await setSMESuspension.mutateAsync({ id, isSuspended, reason });
          }}
        />
      ) : (
        <AdminCampaignTable
          items={campaigns}
          isLoading={setCampaignSuspension.isPending || isCampLoading}
          onToggleSuspend={async (id, isSuspended, reason) => {
            await setCampaignSuspension.mutateAsync({ id, isSuspended, reason });
          }}
        />
      )}
    </div>
  );
}

