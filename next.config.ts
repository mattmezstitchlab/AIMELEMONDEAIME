import type { NextConfig } from "next";

/** En-têtes de sécurité appliqués à toutes les réponses. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  /** Continuité des liens : anciennes pages déplacées dans l'espace personnel unique. */
  async redirects() {
    return [
      { source: "/le-monde-aime/profil", has: [{ type: "query", key: "bienvenue", value: "1" }], destination: "/espace/profil?bienvenue=1", permanent: false },
      { source: "/le-monde-aime/profil", destination: "/espace/profil", permanent: false },
      { source: "/le-monde-aime", has: [{ type: "query", key: "onglet", value: "liens" }], destination: "/espace", permanent: false },
    ];
  },
};

export default nextConfig;
