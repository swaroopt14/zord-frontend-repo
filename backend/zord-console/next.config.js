/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Add webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/constants': require('path').resolve(__dirname, 'constants'),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/types': require('path').resolve(__dirname, 'types'),
      '@/utils': require('path').resolve(__dirname, 'utils'),
      '@/services': require('path').resolve(__dirname, 'services'),
      '@/config': require('path').resolve(__dirname, 'config'),
    }
    return config
  },
}

module.exports = nextConfig
