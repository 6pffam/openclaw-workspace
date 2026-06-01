import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["@openclaw/ui"],
  allowedDevOrigins: ["100.64.128.24"],
};

export default nextConfig;
