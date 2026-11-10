"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { parseProblem } from "@/lib/api/errors";
import { queryKeys } from "@/lib/query-keys";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await api.POST("/api/v1/auth/login", {
      body: { email, password },
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

    const role = data?.user?.role;
    let target = "/sme";
    if (role === "investor") target = "/invest";
    else if (role === "admin" || role === "superadmin") target = "/admin";

    router.push(nextUrl || target);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Alamat Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@usaha.id"
          className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#1D5FAE] focus:outline-none focus:ring-1 focus:ring-[#1D5FAE] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Kata Sandi
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#1D5FAE] focus:outline-none focus:ring-1 focus:ring-[#1D5FAE] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-xl bg-[#1D5FAE] hover:bg-[#184e91] py-2.5 text-sm font-semibold text-white shadow-xs transition active:scale-[0.985] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
      </button>
    </form >
  );
}
