import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2"],
  async rewrites() {
    return [
      {
        source: "/.well-known/:path*",
        destination: "/api/oidc/.well-known/:path*",
      },
    ];
  },
};

export default nextConfig;
