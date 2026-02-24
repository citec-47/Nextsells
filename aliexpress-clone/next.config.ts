import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper transpilation
  transpilePackages: ['lucide-react'],
  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Turbopack configuration for Next.js 16
  turbopack: {},
};

export default nextConfig;
