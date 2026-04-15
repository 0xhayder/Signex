/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'dd.dexscreener.com',
      },
      {
        protocol: 'https',
        hostname: '**.trustwallet.com',
      },
    ],
  },
}

export default nextConfig
