/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',        // Static HTML export — no Node.js server needed
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,     // Required for static file routing
  images: {
    unoptimized: true,     // Required for static export
  },
}

module.exports = nextConfig
