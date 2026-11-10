"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { parseProblem } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";
import { PdpConsent } from "./PdpConsent";

export function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pdpConsent, setPdpConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdpConsent) return;
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await api.POST("/api/v1/auth/register", {
      body: {
        email,
        password,
        full_name: fullName,
        pdp_consent: pdpConsent,
      },
    });

    if (error) {
      setLoading(false);
      const problem = parseProblem(error);
      setErrorMsg(problem.message);
      return;
    }

    if (data) {
      queryClient.setQueryData(queryKeys.auth.me(), data);
      if (typeof window !== "undefined") {
        localStorage.setItem("uhui_session", JSON.stringify(data));
      }
    }
    const targetUrl = nextUrl || (data?.user?.role === "investor" ? "/invest" : "/sme");
    router.push(targetUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Nama Lengkap
        </label>
        <input
          id="name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Budi Santoso"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1D5FAE] focus:outline-none dark:border-white/[0.08] dark:bg-[#121827] dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email Bisnis / Pribadi
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="budi@usaha.id"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1D5FAE] focus:outline-none dark:border-white/[0.08] dark:bg-[#121827] dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Kata Sandi (min. 8 karakter)
        </label>
        <input
          id="reg-pass"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1D5FAE] focus:outline-none dark:border-white/[0.08] dark:bg-[#121827] dark:text-white"
        />
      </div>

      <PdpConsent checked={pdpConsent} onChange={setPdpConsent} />

      <button
        type="submit"
        disabled={loading || !pdpConsent}
        className="flex w-full items-center justify-center rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] py-2.5 text-sm font-semibold text-white shadow-xs transition active:scale-[0.985] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? "Mendaftarkan & Mengarahkan..." : "Daftar Akun Sekarang"}
      </button>
    </form>
  );
}
