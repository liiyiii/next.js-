import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**', // Use a very broad pathname for testing
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
