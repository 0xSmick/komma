import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sql.js'],
  outputFileTracingExcludes: {
    '*': ['./dist/**', './release/**'],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
