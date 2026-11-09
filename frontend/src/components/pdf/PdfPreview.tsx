"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { getVerifyUrl } from "@/lib/pdf/hash";
import { SakEmkmDoc } from "./SakEmkmDoc";
import { ProspectusDoc } from "./ProspectusDoc";
import { ShareholderMonthlyDoc } from "./ShareholderMonthlyDoc";

interface PdfPreviewProps {
  docType: "sak_emkm" | "prospectus" | "shareholder_monthly";
  businessName: string;
  sha256: string;
  data: Record<string, unknown>;
  onRenderDuration?: (ms: number) => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  docType,
  businessName,
  sha256,
  data,
  onRenderDuration,
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const verifyUrl = getVerifyUrl(sha256);

  useEffect(() => {
    const t0 = performance.now();
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 })
      .then((url) => {
        setQrUrl(url);
        const duration = performance.now() - t0;
        if (onRenderDuration) onRenderDuration(duration);
      })
      .catch((err) => console.error("QR generation error:", err));
  }, [verifyUrl, onRenderDuration]);

  if (!qrUrl) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Menyiapkan dokumen PDF...
      </div>
    );
  }

  const documentElement = (() => {
    if (docType === "sak_emkm") {
      return <SakEmkmDoc sha256={sha256} qrDataUrl={qrUrl} verifyUrl={verifyUrl} businessName={businessName} data={data as unknown as Parameters<typeof SakEmkmDoc>[0]["data"]} />;
    }
    if (docType === "prospectus") {
      return <ProspectusDoc sha256={sha256} qrDataUrl={qrUrl} verifyUrl={verifyUrl} data={data as unknown as Parameters<typeof ProspectusDoc>[0]["data"]} />;
    }
    return <ShareholderMonthlyDoc sha256={sha256} qrDataUrl={qrUrl} verifyUrl={verifyUrl} businessName={businessName} data={data as unknown as Parameters<typeof ShareholderMonthlyDoc>[0]["data"]} />;
  })();

  const fileName = `${docType}_${businessName.replace(/\s+/g, "_")}_${sha256.slice(0, 8)}.pdf`;

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center gap-3">
      <div className="text-sm font-medium text-zinc-200">Dokumen PDF Siap Diunduh</div>
      <PDFDownloadLink
        document={documentElement}
        fileName={fileName}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D5FAE] hover:bg-[#184e91] text-white text-sm font-medium rounded-md transition"
      >
        {({ loading }) => (
          <>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? "Merender PDF..." : "Unduh PDF Resmi"}
          </>
        )}
      </PDFDownloadLink>
    </div>
  );
};

