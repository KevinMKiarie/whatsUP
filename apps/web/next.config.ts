import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        // /napi/* → NestJS API — browser calls same origin, Next.js proxies it
        source: '/napi/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
