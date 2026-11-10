"use client";

import React, { useState } from "react";
import { Calendar, Save, Check } from "lucide-react";
import { formatWIB } from "@/lib/dates";

interface IntervalFormProps {
  currentInterval: string;
  nextAnalysisAt?: string | null;
  onSave: (interval: "14_days" | "28_days" | "disabled") => Promise<void>;
}

export const IntervalForm: React.FC<IntervalFormProps> = ({
  currentInterval,
  nextAnalysisAt,
  onSave,
}) => {
  const [val, setVal] = useState<"14_days" | "28_days" | "disabled">(
    (currentInterval as "14_days" | "28_days" | "disabled") || "14_days"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-[#121827] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-sm space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Frekuensi Analisis AI Co-Pilot</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pilih seberapa sering AI mengevaluasi pembukuan dan memberikan 3 rekomendasi taktis bisnis.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { id: "14_days", label: "Analisis Tiap 2 Minggu (14 Hari)", desc: "Rekomendasi untuk UMKM dinamis yang aktif bertransaksi" },
          { id: "28_days", label: "Analisis Tiap 4 Minggu (28 Hari / Bulanan)", desc: "Evaluasi menyeluruh satu siklus penutupan buku kasir" },
          { id: "disabled", label: "Nonaktifkan Analisis Terjadwal", desc: "AI Co-Pilot tidak akan menjalankan evaluasi otomatis" },
        ].map((opt) => (
          <label
            key={opt.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${val === opt.id
                ? "bg-blue-500/10 border-blue-500/50 text-slate-900 dark:text-white"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10"
              }`}
          >
            <input
              type="radio"
              name="ai_interval"
              value={opt.id}
              checked={val === opt.id}
              onChange={() => setVal(opt.id as typeof val)}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {nextAnalysisAt && val !== "disabled" && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/[0.05] rounded-xl text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-[#1D5FAE] shrink-0" />
          <span>Jadwal analisis berikutnya: <strong className="text-slate-900 dark:text-white">{formatWIB(nextAnalysisAt)}</strong></span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D5FAE] hover:bg-[#184e91] text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Tersimpan" : saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
};
