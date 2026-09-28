import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},...['/med25-sw.js','/med25-pdf-cache.mjs','/med25-auth-cache.mjs'].map(source=>({source,headers:[{key:'Cache-Control',value:'no-cache'}]}))];},
  outputFileTracingIncludes: {
    '/api/questions': ['./data/mcq-runtime/*.json'],
    '/api/questions/*': ['./data/mcq-runtime/*.json'],
    '/api/final-exam': ['./data/mcq-runtime/final-*.json'],
    '/api/media': ['./data/mcq-runtime/media.json'],
  },
  // Local credentials are never deployment assets (production uses a durable auth store).
  outputFileTracingExcludes: {'/*':['./.med25-auth/**/*','./.env*']},
};

export default nextConfig;
