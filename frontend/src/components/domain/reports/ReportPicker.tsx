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
        {docTypes.map((item) => {
          const isSelected = selectedType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTypeChange(item.id)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between shadow-xs ${isSelected
                  ? "bg-[#1D5FAE] border-[#184e91] text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border-[#B9C8DD] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#1D5FAE] hover:bg-[#DFE9F1]/30"
                }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className={isSelected ? "text-[#DFE9F1]" : "text-[#1D5FAE]"}>
                  {item.icon}
                </span>
                <span className={isSelected ? "text-white" : "text-[#0F1E2E] dark:text-white"}>{item.label}</span>
              </div>
              <p className={`text-xs mt-2 leading-relaxed ${isSelected ? "text-white/90" : "text-slate-500 dark:text-slate-400"}`}>
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-3.5 bg-[#1D5FAE] border border-[#184e91] rounded-2xl text-white shadow-xs">
        <label htmlFor="period-picker" className="text-xs font-bold text-white">
          Periode Bulan:
        </label>
        <input
          id="period-picker"
          type="month"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="bg-[#184e91] border border-white/20 text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:border-white focus:outline-none"
        />
      </div>
    </div>
  );
};

