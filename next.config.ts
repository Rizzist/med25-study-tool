import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/questions': ['./data/mcq-runtime/*.json'],
    '/api/questions/*': ['./data/mcq-runtime/*.json'],
    '/api/final-exam': ['./data/mcq-runtime/final-*.json'],
    '/api/media': ['./data/mcq-runtime/media.json'],
  },
};

export default nextConfig;
