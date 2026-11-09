import React from "react";
import { ShieldCheck, Info } from "lucide-react";

interface HealthScoreCardProps {
  score: number;
  periodDays: number;
  modelName: string;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  score,
  periodDays,
  modelName,
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 75) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (val >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center font-bold text-3xl ${getScoreColor(score)}`}>
          {score}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-100">Skor Kesehatan Operasional</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {periodDays} Hari
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Dihitung dari data deterministik, bukan opini AI</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500 border border-zinc-800 px-3 py-1.5 rounded-md bg-zinc-950">
        <ShieldCheck className="w-4 h-4 text-blue-500" />
        <span>Model Analisis: {modelName}</span>
      </div>
    </div>
  );
};

