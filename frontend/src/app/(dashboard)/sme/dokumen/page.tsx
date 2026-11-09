"use client";

import React, { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useDocuments } from "@/hooks/use-documents";
import { DocCard, type SMEDocInfo } from "@/components/documents/DocCard";
import { UploadDocModal } from "@/components/documents/UploadDocModal";

export default function DocumentsPage() {
  const { smeId } = useSession();
  const { documents, isLoading, uploadDocument } = useDocuments(smeId);
  const [activeUploadDocType, setActiveUploadDocType] = useState<string | null>(null);

  const docMap = new Map(documents.map((d) => [d.doc_type, d]));

  const docDefinitions: SMEDocInfo[] = [
    {
      docType: "nib",
      title: "Nomor Induk Berusaha (NIB)",
      description: "Identitas perizinan usaha resmi dari OSS (Online Single Submission).",
      isRequiredForBursa: true,
      uploadedDoc: docMap.has("nib")
        ? {
          id: docMap.get("nib")!.id,
          status: docMap.get("nib")!.status,
          reviewNote: docMap.get("nib")!.review_note,
          downloadUrl: docMap.get("nib")!.download_url,
          createdAt: docMap.get("nib")!.created_at,
        }
        : undefined,
    },
    {
      docType: "ktp_owner",
      title: "KTP Pemilik Usaha / Direktur",
      description: "Identitas kependudukan sah pemilik atau perwakilan penanggung jawab bisnis.",
      uploadedDoc: docMap.has("ktp_owner")
        ? {
          id: docMap.get("ktp_owner")!.id,
          status: docMap.get("ktp_owner")!.status,
          reviewNote: docMap.get("ktp_owner")!.review_note,
          downloadUrl: docMap.get("ktp_owner")!.download_url,
          createdAt: docMap.get("ktp_owner")!.created_at,
        }
        : undefined,
    },
    {
      docType: "npwp",
      title: "NPWP Usaha / Badan Usaha",
      description: "Nomor Pokok Wajib Pajak untuk kepatuhan perpajakan.",
      uploadedDoc: docMap.has("npwp")
        ? {
          id: docMap.get("npwp")!.id,
          status: docMap.get("npwp")!.status,
          reviewNote: docMap.get("npwp")!.review_note,
          downloadUrl: docMap.get("npwp")!.download_url,
          createdAt: docMap.get("npwp")!.created_at,
        }
        : undefined,
    },
    {
      docType: "sk_kemenkumham",
      title: "SK Kemenkumham Pendirian PT",
      description: "Wajib untuk pendaftaran Bursa Mikro-Ekuitas. Menjamin status badan hukum perseroan.",
      isRequiredForBursa: true,
      uploadedDoc: docMap.has("sk_kemenkumham")
        ? {
          id: docMap.get("sk_kemenkumham")!.id,
          status: docMap.get("sk_kemenkumham")!.status,
          reviewNote: docMap.get("sk_kemenkumham")!.review_note,
          downloadUrl: docMap.get("sk_kemenkumham")!.download_url,
          createdAt: docMap.get("sk_kemenkumham")!.created_at,
        }
        : undefined,
    },
  ];

  const handleUpload = async (docType: string, fileBase64: string, filename: string) => {
    await uploadDocument.mutateAsync({ docType, fileBase64, filename });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Dokumen Legalitas &amp; Verifikasi Usaha
            </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah dokumen resmi untuk kurasi tim kepatuhan agar UMKM dapat membuka penawaran investasi.
              </p>
            </div>
        </div>

        {isLoading ? (
            <div className="flex h-40 items-center justify-center text-xs text-slate-400">
              Memuat status dokumen...
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {docDefinitions.map((info) => (
                <DocCard
                  key={info.docType}
                  info={info}
                  onUploadClick={(dt) => setActiveUploadDocType(dt)}
                />
              ))}
            </div>
      )}

            <UploadDocModal
              isOpen={!!activeUploadDocType}
              docType={activeUploadDocType}
              onClose={() => setActiveUploadDocType(null)}
              onUpload={handleUpload}
            />
          </div>
        );
}
