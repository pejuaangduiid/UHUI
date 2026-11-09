import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query", "clsx", "tailwind-merge"],
  },
  // Rewrite /api/v1/* ke backend Go
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://127.0.0.1:8080"}/api/v1/:path*`,
      },
    ];
  },

  // Header keamanan statis
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Tidak tampilkan header X-Powered-By
  poweredByHeader: false,
};

export default nextConfig;
