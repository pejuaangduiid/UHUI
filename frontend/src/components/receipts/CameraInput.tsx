"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { compressImage, MAX_ORIGINAL_SIZE_BYTES } from "@/lib/image";

interface CameraInputProps {
  onImageSelected: (base64: string, dataUrl: string, filename: string) => void;
  isLoading?: boolean;
}

export function CameraInput({ onImageSelected, isLoading = false }: CameraInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    if (file.size > MAX_ORIGINAL_SIZE_BYTES) {
      setError("Ukuran gambar melebihi batas maksimal 5 MB. Silakan pilih gambar lebih kecil.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setCompressing(true);
    try {
      const res = await compressImage(file);
      onImageSelected(res.base64, res.dataUrl, file.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memproses gambar");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        data-testid="receipt-file-input"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center transition hover:border-zinc-400 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
          {compressing || isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-zinc-100" />
          ) : (
            <Camera className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
          )}
        </div>
        <h4 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
          Ambil Foto atau Unggah Nota
        </h4>
        <p className="mt-1 text-xs text-zinc-400">
          Format: JPEG, PNG, WebP (Maksimal 5 MB). Gambar akan dikompresi otomatis.
        </p>
      </div>

      {error && (
        <div
          data-testid="file-size-error"
          className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}
    </div>
  );
}
