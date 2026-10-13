import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  /** Continuité des liens : anciennes pages déplacées dans l'espace personnel unique. */
  async redirects() {
    return [
      { source: "/le-monde-aime/profil", destination: "/espace/profil", permanent: false },
      { source: "/le-monde-aime", has: [{ type: "query", key: "onglet", value: "liens" }], destination: "/espace", permanent: false },
    ];
  },
};

export default nextConfig;
