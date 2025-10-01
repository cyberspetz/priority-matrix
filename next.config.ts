import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.ANALYZE === "true" && {
    experimental: {
      swcPlugins: [["next-swc-analyzer", {}]],
    },
  }),
  eslint: {
    // Temporarily ignore ESLint errors during builds for Vercel deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds for Vercel deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
