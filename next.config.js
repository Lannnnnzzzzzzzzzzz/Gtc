/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  // Allow server-side fetch to external domains used by the original PHP script
  images: { domains: [] },
}
module.exports = nextConfig
