import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*", "./public/study/**/*"],
  },
};

export default nextConfig;
