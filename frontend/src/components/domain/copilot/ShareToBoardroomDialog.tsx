"use client";

import React, { useState } from "react";
import { useShareAiReportToBoardroom } from "@/hooks/use-boardroom";
import { Share2, AlertCircle, X, CheckCircle2 } from "lucide-react";

interface ShareToBoardroomDialogProps {
  smeId: string;
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareToBoardroomDialog({
  smeId,
  reportId,
  isOpen,
  onClose,
}: ShareToBoardroomDialogProps) {
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);

  const shareMutation = useShareAiReportToBoardroom(smeId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;

    shareMutation.mutate(
      { reportId, note, confirm: true },
      {
        onSuccess: () => setSuccess(true),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card text-card-foreground border rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in-50 zoom-in-95 text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="h-10 w-10 text-blue-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              Laporan Berhasil Dibagikan!
            </h3>
            <p className="text-muted-foreground">
              Laporan Diagnostik AI telah diterbitkan ke Ruang Rapat Pemegang Saham. Seluruh investor terverifikasi dapat membaca ringkasan diagnostik ini.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Share2 className="h-4 w-4 text-primary" />
              <span>Bagikan Diagnostik ke Ruang Rapat</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Tindakan ini akan membagikan skor kesehatan bisnis dan ringkasan eksekutif AI Co-Pilot kepada seluruh pemegang saham di ruang rapat privat.
            </p>

            <div>
              <label className="font-medium block mb-1">Catatan Tambahan untuk Investor (Opsional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth. Strategi pemulihan stok dan efisiensi biaya bulan ini..."
                className="w-full px-3 py-2 border rounded-lg bg-background resize-none leading-relaxed"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-3 text-amber-900 dark:text-amber-200 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Pastikan Anda telah memeriksa anomali dan rekomendasi sebelum dipublikasikan kepada mitra investor Anda.
              </span>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-muted-foreground"
              />
              <span>
                Saya menyetujui laporan diagnostik ini dibagikan ke Ruang Rapat Pemegang Saham.
              </span>
            </label>

            <button
              type="submit"
              disabled={!confirmed || shareMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {shareMutation.isPending ? "Membagikan..." : "Bagikan ke Pemegang Saham"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

