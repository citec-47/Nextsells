import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

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
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.auth0.com',
      },
    ],
  },
  // Turbopack configuration for Next.js 16
  turbopack: {
    // Prevent Next from inferring a parent workspace root when multiple lockfiles exist.
    // Route discovery can become inconsistent when root points outside this app.
    root: projectRoot,
  },
};

export default nextConfig;
