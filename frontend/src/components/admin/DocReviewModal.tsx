"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, Loader2, X, XCircle } from "lucide-react";

export interface QueueItemData {
  id: string;
  sme_id: string;
  business_name: string;
  doc_type: string;
  storage_key: string;
  status: string;
  download_url?: string;
  created_at: string;
}

interface DocReviewModalProps {
  doc: QueueItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, status: "approved" | "rejected", note?: string) => Promise<void>;
}

export function DocReviewModal({ doc, isOpen, onClose, onSubmit }: DocReviewModalProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !doc) return null;

  const handleAction = async (status: "approved" | "rejected") => {

    if (status === "rejected" && !reviewNote.trim()) {
      setError("Catatan penolakan wajib diisi agar UMKM mengetahui alasan perbaikan.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(doc.id, status, reviewNote.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memproses verifikasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Verifikasi Dokumen Kurator</h3>
            <p className="text-xs text-zinc-500">{doc.business_name} - {doc.doc_type.toUpperCase()}</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4 text-sm">
          {doc.download_url && (
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
              <span className="text-xs text-zinc-600 dark:text-zinc-300">Pratinjau / Berkas Dokumen:</span>
              <a
                href={doc.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                <Download className="h-3.5 w-3.5" /> Buka Berkas (Signed URL)
              </a>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Catatan Verifikasi (Wajib jika menolak)
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Contoh: Nomor NIB tidak terdaftar di OSS / Dokumen buram"
              className="mt-1 w-full rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700 dark:bg-zinc-800"
              data-testid="review-note-input"
            />
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              disabled={loading || !reviewNote.trim()}
              onClick={() => handleAction("rejected")}
              data-testid="admin-reject-button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
            >
              <XCircle className="h-4 w-4" /> Tolak
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("approved")}
              data-testid="admin-approve-button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Setujui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

