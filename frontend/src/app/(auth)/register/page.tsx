import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { RegisterForm } from "@/components/domain/auth/RegisterForm";
import { GLOSSARY } from "@/lib/glossary";

export default function RegisterPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-72 bg-blue-600/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl dark:border-white/[0.08] dark:bg-[#121827]/90 backdrop-blur-md">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center mb-1">
            <Image
              src="/Logo.jpeg"
              alt="UHUI Logo"
              width={160}
              height={60}
              className="h-12 w-auto object-contain rounded-xl bg-white px-2 py-1 shadow-xs"
              priority
            />
          </Link>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daftar Akun Baru
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {GLOSSARY.simulationNotice.label}
          </p>
        </div>

        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />}>
          <RegisterForm />
        </Suspense>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-bold text-[#1D5FAE] hover:underline dark:text-blue-400"
          >
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
