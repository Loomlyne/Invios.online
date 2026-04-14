import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
  serverActions: {
    bodySizeLimit: "5mb",
  },
};

export default nextConfig;
