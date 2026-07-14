import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep the workspace root here — a stray lockfile in the home directory
    // makes Next infer the wrong root otherwise.
    root: __dirname,
  },
};

export default nextConfig;
