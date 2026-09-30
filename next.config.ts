import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},...['/med25-sw.js','/med25-pdf-cache.mjs','/med25-auth-cache.mjs','/med25-pwa-shell.mjs','/manifest.webmanifest','/pwa/offline.html'].map(source=>({source,headers:[{key:'Cache-Control',value:'no-cache'}]})),{source:'/med25-sw.js',headers:[{key:'Service-Worker-Allowed',value:'/'},{key:'Content-Security-Policy',value:"default-src 'none'; script-src 'self'; connect-src 'self'"}]},{source:'/pwa/:icon(.*-v1\\.png)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}];},
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
