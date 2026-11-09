
export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  hint?: string;
  errors?: Record<string, string>;
}

export const ERROR_MESSAGES: Record<string, { message: string; hint: string }> = {
  INVALID_CREDENTIALS: {
    message: "Email atau kata sandi tidak cocok.",
    hint: "Periksa kembali kombinasi email dan kata sandi Anda.",
  },
  EMAIL_ALREADY_EXISTS: {
    message: "Email ini sudah terdaftar.",
    hint: "Gunakan email lain atau masuk dengan akun yang sudah ada.",
  },
  INSUFFICIENT_STOCK: {
    message: "Stok barang tidak mencukupi.",
    hint: "Periksa jumlah stok fisik atau lakukan restock barang masuk.",
  },
  RATE_LIMIT_EXCEEDED: {
    message: "Terlalu banyak permintaan.",
    hint: "Tunggu beberapa saat sebelum mencoba kembali.",
  },
  UNAUTHORIZED: {
    message: "Sesi telah berakhir.",
    hint: "Silakan masuk kembali untuk melanjutkan.",
  },
  FORBIDDEN: {
    message: "Akses ditolak.",
    hint: "Anda tidak memiliki wewenang untuk tindakan ini.",
  },
  VALIDATION_ERROR: {
    message: "Data yang dimasukkan tidak valid.",
    hint: "Periksa kembali isian formulir yang ditandai merah.",
  },
};

export function parseProblem(err: unknown): {
  code: string;
  message: string;
  hint: string;
  fieldErrors?: Record<string, string>;
} {
  const p = err as ApiProblem;
  const code = p?.code ?? "INTERNAL_SERVER_ERROR";
  const mapped = ERROR_MESSAGES[code];
  const fallback = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";

  return {
    code,
    message: mapped?.message ?? p?.detail ?? p?.title ?? fallback,
    hint: mapped?.hint ?? p?.hint ?? "Coba muat ulang halaman atau hubungi dukungan teknis.",
    fieldErrors: p?.errors,
  };
}

