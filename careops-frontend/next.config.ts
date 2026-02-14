import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Turbopack configuration
  turbopack: {
    // Set root directory for monorepo support
    root: process.cwd(),
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization for production
  images: {
    // For Vercel: use default image optimization
    // For self-hosting: set unoptimized: true
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 1 day
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react'],
  },
  
  // Redirects for clean URLs
  async redirects() {
    return [];
  },
};

export default nextConfig;
