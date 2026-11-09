import React from "react";

const STAGES = [
  { key: "draft", label: "Draft" },
  { key: "in_review", label: "Review" },
  { key: "open", label: "Bursa Aktif" },
  { key: "funded", label: "Terdanai" },
  { key: "closed", label: "Selesai" },
];

export function StatusTracker({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const currentIndex = STAGES.findIndex((s) => s.key === status);

  if (isCancelled) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-xs font-semibold text-center">
        Status: Dibatalkan / Ditolak
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 -z-0" />
        {STAGES.map((s, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={s.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isDone
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium ${
                  isCurrent ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

