// @ts-check
// Using @ts-check for basic type checking in JS with JSDoc, if your editor supports it.

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Add other Next.js config options here if needed in the future
  // For example, if you were using experimental features or custom webpack config:
  // experimental: {
  //   appDir: true, // If using App Router, though this is often default now
  // },
  // typescript: {
  //   ignoreBuildErrors: true, // Might be useful during transition if any TS errors linger from tooling
  // },
};

module.exports = nextConfig;
