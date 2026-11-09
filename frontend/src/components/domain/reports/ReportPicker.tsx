import React from "react";
import { FileText, Award, Users } from "lucide-react";

export type DocType = "sak_emkm" | "prospectus" | "shareholder_monthly";

interface ReportPickerProps {
  selectedType: DocType;
  selectedPeriod: string;
  onTypeChange: (t: DocType) => void;
  onPeriodChange: (p: string) => void;
}

export const ReportPicker: React.FC<ReportPickerProps> = ({
  selectedType,
  selectedPeriod,
  onTypeChange,
  onPeriodChange,
}) => {
  const docTypes: { id: DocType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "sak_emkm",
      label: "SAK EMKM",
      icon: <FileText className="w-4 h-4" />,
      desc: "Laba Rugi & Neraca Ringkas Standar Akuntansi Keuangan",
    },
    {
      id: "prospectus",
      label: "Prospektus",
      icon: <Award className="w-4 h-4" />,
      desc: "Pitch Deck & Ringkasan Skor Kesiapan Investasi",
    },
    {
      id: "shareholder_monthly",
      label: "Laporan Mitra",
      icon: <Users className="w-4 h-4" />,
      desc: "Laporan Bulanan Pemegang Saham & Mitra Bagi Hasil",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {docTypes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTypeChange(item.id)}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${selectedType === item.id
                ? "bg-blue-950/30 border-blue-500/50 text-zinc-100"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400"
              }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm text-zinc-200">
              <span className={selectedType === item.id ? "text-blue-400" : "text-zinc-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
        <label htmlFor="period-picker" className="text-xs font-medium text-zinc-400">
          Periode Bulan:
        </label>
        <input
          id="period-picker"
          type="month"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded px-3 py-1.5 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

