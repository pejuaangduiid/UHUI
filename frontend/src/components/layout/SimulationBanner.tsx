"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function SimulationBanner() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      if (
        sessionStorage.getItem("uhui_hide_sim_banner") === "1" ||
        localStorage.getItem("uhui_hide_sim_banner") === "1"
      ) {
        setIsVisible(false);
      }
    } catch {
      
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("uhui_hide_sim_banner", "1");
      localStorage.setItem("uhui_hide_sim_banner", "1");
    } catch {
      
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500 text-slate-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between gap-3 border-b border-amber-600 shadow-sm"
    >
      <div className="flex-1 flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-4 w-4 shrink-0 text-slate-950" />
        <span>
          <strong>PERINGATAN:</strong> Bursa Mikro-Ekuitas ini bersifat{" "}
          <strong>SIMULASI EDUKASI</strong> &amp; sandbox internal. Bukan
          penawaran efek komersial riil terdaftar OJK.
        </span>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Tutup pemberitahuan simulasi"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-950 hover:bg-amber-600/40 active:scale-95 transition-all cursor-pointer font-bold"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
