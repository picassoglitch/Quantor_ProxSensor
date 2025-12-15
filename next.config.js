/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Improve font loading reliability
  experimental: {
    optimizeFonts: true,
  },
}

module.exports = nextConfig

