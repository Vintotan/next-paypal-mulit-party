import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@trpc/server"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
