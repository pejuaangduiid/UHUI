"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    // Respect user's explicit preference; default to light (Stitch warm paper)
    const isDarkMode = stored === "dark";
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-[#E2E7EB] dark:border-white/10 bg-white/70 dark:bg-[#132235]/70" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ganti ke mode terang (Warm Paper)" : "Ganti ke mode gelap (Deep Navy)"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E7EB] bg-white/90 text-[#0F1E2E] shadow-sm transition hover:bg-[#F4F3F1] dark:border-white/10 dark:bg-[#132235] dark:text-slate-200 dark:hover:bg-[#172940]"
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#516072]" />}
    </button>
  );
}
