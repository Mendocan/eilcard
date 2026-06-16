import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd() + "/../../",
  transpilePackages: ["@digitalcard/schema"],
};

export default nextConfig;
