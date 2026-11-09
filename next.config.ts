import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async rewrites() {
    // I documenti OAuth stanno in /.well-known/...; le cartelle che iniziano
    // con un punto non sono comode come route, quindi le serviamo da /well-known.
    return [{ source: "/.well-known/:path*", destination: "/well-known/:path*" }];
  },
};

export default nextConfig;
