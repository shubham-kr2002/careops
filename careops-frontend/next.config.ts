import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Turbopack configuration
  turbopack: {
    // Set root directory for monorepo support
    root: process.cwd(),
  },
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Experimental features
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
