/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable file watching with polling for Docker
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig
