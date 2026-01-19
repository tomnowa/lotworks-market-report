/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable if you need to call external APIs
  experimental: {
    serverComponentsExternalPackages: ['@google-analytics/data'],
  },
}

module.exports = nextConfig
