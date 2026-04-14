import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverActions: {
    bodySizeLimit: "5mb",
  },
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
};

export default nextConfig;
