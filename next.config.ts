import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['recharts'],
  // Removing custom webpack alias to prevent Vercel worker conflicts
};

export default nextConfig;
