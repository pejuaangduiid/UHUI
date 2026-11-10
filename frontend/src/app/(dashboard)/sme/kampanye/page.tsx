"use client";

import React, { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { useSmeCampaigns } from "@/hooks/use-campaigns";
import { useDocuments, useSMEProfile } from "@/hooks/use-documents";
import { CampaignForm } from "@/components/domain/campaign/CampaignForm";
import { StatusTracker } from "@/components/domain/campaign/StatusTracker";
import { RequiredDocumentsCard } from "@/components/domain/campaign/RequiredDocumentsCard";
import { formatIDR } from "@/lib/money";
import { PlusCircle, AlertCircle } from "lucide-react";

export default function SmeCampaignsPage() {
  const { smeId } = useSession();
  const { list, create, submit, cancel } = useSmeCampaigns(smeId);
  const { profile } = useSMEProfile(smeId);
  const { documents } = useDocuments(smeId);
  const [showForm, setShowForm] = useState(false);

  const campaigns = list.data ?? [];
  const nibDoc = documents.find((d) => d.doc_type === "nib");
  const npwpDoc = documents.find((d) => d.doc_type === "npwp");
  const ptDoc = documents.find((d) => d.doc_type === "pt_deed" || d.doc_type === "sk_kemenkumham");
  const isPT = Boolean(profile?.is_incorporated_pt);
  const isSuspended = Boolean(profile?.is_suspended);
  const isVerifiedForBursa = !isSuspended && nibDoc?.status === "verified" && npwpDoc?.status === "verified" && (!isPT || ptDoc?.status === "verified");

  return (
    <div className="space-y-6">
      {isSuspended && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span><strong>Usaha Ditangguhkan:</strong> Pengajuan bursa saham tidak dapat dilakukan karena usaha sedang terkena sanksi admin{profile?.suspension_reason ? ` ("${profile.suspension_reason}")` : ""}.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Jual Saham Usaha di Bursa UHUI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftarkan dan jual porsi saham/ekuitas usaha Anda kepada para investor publik di bursa UHUI.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-500/20"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showForm ? "Tutup Formulir" : "Jual Saham Baru"}</span>
        </button>
      </div>

      <RequiredDocumentsCard smeId={smeId} />

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827]">
          <h2 className="font-bold text-sm mb-3 text-slate-900 dark:text-white">Pengajuan Kampanye Baru</h2>
          {!isVerifiedForBursa && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Dokumen legalitas (NIB, NPWP, Akta PT) harus disetujui oleh kurator admin sebelum penjualan saham dapat diproses di bursa.
            </div>
          )}
          <CampaignForm
            isPT={isPT}
            onSubmit={(data) => {
              create.mutate(data, {
                onSuccess: () => setShowForm(false),
              });
            }}
            isLoading={create.isPending}
          />
        </div>
      )}

      {
        list.isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl border border-slate-200/50 bg-slate-100/50 dark:border-white/5 dark:bg-slate-900/40 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-white dark:border-white/10 dark:bg-[#121827] text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Belum ada kampanye pendanaan</p>
            <p>Mulai ajukan kampanye pendanaan mikro-ekuitas atau bagi hasil untuk usaha Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                      {c.scheme === "micro_equity" ? "Mikro-Ekuitas" : "Bagi Hasil"}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">{c.title}</h3>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[11px]">Terkumpul / Target</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatIDR(c.raised_amount_idr)} / {formatIDR(c.target_amount_idr)}
                    </span>
                  </div>
                </div>

                <StatusTracker status={c.status} />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex gap-4 text-slate-500 dark:text-slate-400">
                    <span>Tenor: <strong className="text-slate-900 dark:text-white">{c.term_months} Bln</strong></span>
                    <span>Bagi Hasil: <strong className="text-slate-900 dark:text-white">{(c.return_share_bps / 100).toFixed(2)}%</strong></span>
                    <span>Min: <strong className="text-slate-900 dark:text-white">{formatIDR(c.min_investment_idr)}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    {c.status === "draft" && (
                      <button
                        onClick={() => submit.mutate(c.id)}
                        disabled={submit.isPending}
                        className="bg-[#1D5FAE] hover:bg-[#184e91] text-white px-3 py-1.5 rounded-xl font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        {submit.isPending ? "Mengajukan..." : "Ajukan Review Admin"}
                      </button>
                    )}
                    {c.status === "in_review" && (
                      <button
                        onClick={() => cancel.mutate(c.id)}
                        disabled={cancel.isPending}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 px-3 py-1.5 rounded-xl font-semibold transition disabled:opacity-50"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div >
  );
}
