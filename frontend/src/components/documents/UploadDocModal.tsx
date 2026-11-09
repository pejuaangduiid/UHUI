"use client";

import React, { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";

interface UploadDocModalProps {
  isOpen: boolean;
  docType: string | null;
  onClose: () => void;
  onUpload: (docType: string, fileBase64: string, filename: string) => Promise<void>;
}

export function UploadDocModal({ isOpen, docType, onClose, onUpload }: UploadDocModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !docType) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas tidak boleh melebihi 5 MB");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Silakan pilih berkas dokumen");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        await onUpload(docType, base64, selectedFile.name);
        onClose();
      };
      reader.onerror = () => {
        setError("Gagal membaca berkas");
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah berkas");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Unggah Dokumen: {docType.toUpperCase()}</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 p-6 text-center hover:border-zinc-400 dark:border-zinc-800"
          >
            <UploadCloud className="h-8 w-8 text-zinc-400" />
            <span className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {selectedFile ? selectedFile.name : "Klik untuk memilih berkas"}
            </span>
            <span className="text-[11px] text-zinc-400">PDF, JPEG, PNG, atau WebP (Maks 5 MB)</span>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Mengunggah..." : "Unggah"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

