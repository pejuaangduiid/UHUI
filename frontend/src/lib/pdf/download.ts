import React from "react";
import QRCode from "qrcode";
import { pdf, DocumentProps } from "@react-pdf/renderer";
import { SakEmkmDoc } from "@/components/pdf/SakEmkmDoc";
import { ProspectusDoc } from "@/components/pdf/ProspectusDoc";
import { ShareholderMonthlyDoc } from "@/components/pdf/ShareholderMonthlyDoc";
import { getVerifyUrl } from "./hash";

export interface DownloadPdfParams {
  title: string;
  docType: string;
  sha256: string;
  businessName: string;
  sector?: string;
  isPt?: boolean;
  figures?: {
    total_revenue_idr?: number;
    net_profit_idr?: number;
    total_assets_idr?: number;
  };
  downloadUrl?: string;
}

export async function downloadRealPdf({
  title,
  docType,
  sha256,
  businessName,
  sector = "Kuliner",
  isPt = false,
  figures,
  downloadUrl,
}: DownloadPdfParams) {
  if (downloadUrl && downloadUrl.startsWith("http") && !downloadUrl.includes("/verify/")) {
    window.open(downloadUrl, "_blank");
    return;
  }

  const cleanHash = (sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855").replace(/^sha256:/, "");
  const verifyUrl = getVerifyUrl(cleanHash);
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });
  } catch {
    qrDataUrl = "";
  }

  const revenue = figures?.total_revenue_idr || 50_000_000;
  const netProfit = figures?.net_profit_idr || 20_000_000;
  const totalAssets = figures?.total_assets_idr || 50_000_000;
  const restockExp = Math.floor((revenue - netProfit) * 0.6);
  const operExp = Math.floor((revenue - netProfit) * 0.4);

  let docElement: React.ReactElement<DocumentProps>;
  if (docType === "prospectus") {
    docElement = React.createElement(ProspectusDoc, {
      sha256: cleanHash,
      qrDataUrl,
      verifyUrl,
      data: {
        business_name: businessName,
        sector,
        is_pt: isPt,
        description: `Prospektus resmi penawaran saham ${businessName}.`,
        readiness_score: 85,
        component_a: 80,
        component_b: 85,
        component_c: 90,
        component_d: 85,
        revenue_30d_idr: revenue,
        expense_30d_idr: revenue - netProfit,
        net_cash_30d_idr: netProfit,
        simulation_label: "Simulasi Pasar Sekunder Terbuka",
      },
    }) as React.ReactElement<DocumentProps>;
  } else if (docType === "sak_emkm") {
    docElement = React.createElement(SakEmkmDoc, {
      sha256: cleanHash,
      qrDataUrl,
      verifyUrl,
      businessName,
      data: {
        period_start: "2026-10-01",
        period_end: "2026-10-31",
        revenue_idr: revenue,
        restock_expense_idr: restockExp,
        operational_expense_idr: operExp,
        total_expense_idr: revenue - netProfit,
        net_profit_idr: netProfit,
        cash_balance_idr: 35_000_000,
        total_inventory_cost_idr: 15_000_000,
        total_assets_idr: totalAssets,
      },
    }) as React.ReactElement<DocumentProps>;
  } else {
    docElement = React.createElement(ShareholderMonthlyDoc, {
      sha256: cleanHash,
      qrDataUrl,
      verifyUrl,
      businessName,
      data: {
        period_start: "2026-10-01",
        period_end: "2026-10-31",
        revenue_idr: revenue,
        restock_expense_idr: restockExp,
        operational_expense_idr: operExp,
        total_expense_idr: revenue - netProfit,
        net_profit_idr: netProfit,
        tx_count: 48,
        active_days: 30,
      },
    }) as React.ReactElement<DocumentProps>;
  }

  const blob = await pdf(docElement).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
