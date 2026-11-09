import React from "react";
import { AlertTriangle, TrendingDown, PackageX } from "lucide-react";

interface Anomaly {
  id: string;
  type: string;
  title: string;
  description: string;
}

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "dead_stock":
        return <PackageX className="w-4 h-4 text-amber-400" />;
      case "price_up":
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 text-center">
        Tidak ditemukan anomali berisiko tinggi pada periode ini. Operasional berjalan normal.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {anomalies.map((a) => (
        <div key={a.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start gap-3.5">
          <div className="mt-0.5 p-2 rounded-md bg-zinc-800 shrink-0">
            {getIcon(a.type)}
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-100">{a.title}</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{a.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

