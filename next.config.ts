import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/CHACHUSCAPE",
  images: {
    unoptimized: true,
  },
  devIndicators: false,
};

export default nextConfig;
