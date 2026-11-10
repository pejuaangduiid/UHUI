"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  useCommunityGroups,
  useJoinCommunityGroup,
  useLeaveCommunityGroup,
  useCreateCommunityGroup,
} from "@/hooks/use-community-groups";
import { Users, CheckCircle2, Utensils, ShoppingBag, Sparkles, Trees, Wrench, Plus, X } from "lucide-react";

interface SectoralGroupsProps {
  selectedGroupSlug: string;
  onSelectGroup: (slug: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  trees: Trees,
  wrench: Wrench,
};

export function SectoralGroups({ selectedGroupSlug, onSelectGroup }: SectoralGroupsProps) {
  const { data: groups, isLoading } = useCommunityGroups();
  const joinMutation = useJoinCommunityGroup();
  const leaveMutation = useLeaveCommunityGroup();
  const createMutation = useCreateCommunityGroup();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("Kuliner");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, sector, description }, {
      onSuccess: () => { setModalOpen(false); setName(""); setDescription(""); },
    });
  };

  if (isLoading) return <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-[#1D5FAE]" />
          <span>Grup Komunitas Sektoral UMKM</span>
        </h3>
        <div className="flex items-center gap-2">
          {selectedGroupSlug && (
            <button type="button" onClick={() => onSelectGroup("")} className="text-[11px] font-semibold text-[#1D5FAE] hover:underline">
              Reset Filter Sektor
            </button>
          )}
          <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D5FAE] dark:text-blue-400 hover:underline">
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Grup Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {groups?.map((g) => {
          const Icon = ICON_MAP[g.icon_name] || Users;
          const isSelected = selectedGroupSlug === g.slug;
          return (
            <div
              key={g.id}
              onClick={() => onSelectGroup(isSelected ? "" : g.slug)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${isSelected ? "border-[#1D5FAE] bg-[#DFE9F1]/40 shadow-sm" : "border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#121827] hover:border-slate-300"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${isSelected ? "bg-[#1D5FAE] text-white" : "bg-slate-100 dark:bg-slate-800 text-[#1D5FAE]"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {g.is_member && <CheckCircle2 className="h-4 w-4 text-[#1D5FAE] shrink-0" />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{g.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{g.member_count} Anggota</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (g.is_member) {
                    toast.warning(`Keluar dari grup ${g.name}?`, {
                      action: {
                        label: "Keluar",
                        onClick: () => {
                          leaveMutation.mutate(g.id, {
                            onSuccess: () => toast.success(`Berhasil keluar dari ${g.name}`),
                            onError: (err: { detail?: string; message?: string }) => toast.error("Gagal keluar dari grup: " + (err?.detail || err?.message || "Terjadi kesalahan")),
                          });
                        },
                      },
                      cancel: { label: "Batal", onClick: () => { } },
                    });
                  } else {
                    joinMutation.mutate(g.id, {
                      onSuccess: () => toast.success(`Berhasil bergabung ke ${g.name}!`),
                      onError: (err: { detail?: string; message?: string }) => toast.error("Gagal bergabung ke grup: " + (err?.detail || err?.message || "Terjadi kesalahan")),
                    });
                  }
                }}
                disabled={joinMutation.isPending || leaveMutation.isPending}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${g.is_member
                  ? "bg-slate-100 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  : "bg-[#1D5FAE] hover:bg-[#184e91] text-white shadow-xs"
                  }`}
              >
                {g.is_member ? "Keluar Grup" : "Gabung"}
              </button>
            </div>
          );
        })}
      </div>

      {
            modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <form onSubmit={handleCreate} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#121827] space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Buat Grup Komunitas Baru</h4>
                    <button type="button" onClick={() => setModalOpen(false)}><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Grup (cth: Komunitas Kopi Artisan)" className="w-full rounded-xl border border-slate-200 p-2 dark:border-white/10 dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <input type="text" required value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Sektor (cth: Kuliner, Retail, Jasa)" className="w-full rounded-xl border border-slate-200 p-2 dark:border-white/10 dark:bg-slate-800 text-slate-900 dark:text-white" />
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi tujuan grup..." className="w-full rounded-xl border border-slate-200 p-2 dark:border-white/10 dark:bg-slate-800 text-slate-900 dark:text-white" />
                    <button type="submit" disabled={createMutation.isPending} className="w-full py-2 bg-[#1D5FAE] text-white rounded-[11px] font-semibold hover:bg-[#184e91] transition shadow-sm">
                      {createMutation.isPending ? "Menyimpan..." : "Buat Grup"}
                    </button>
                </form>
              </div>
            )
          }
        </div >
        );
}
