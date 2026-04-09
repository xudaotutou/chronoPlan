/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Only ignore build errors in development (set via env var)
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_TS_ERRORS === "true",
  },
  turbopack: {
    resolveAlias: {
      // starkzap optional peer dependencies - only needed for specific features
      "@fatsolutions/tongo-sdk": {},
      "@solana/web3.js": {},
      "@hyperlane-xyz/sdk": {},
      "@hyperlane-xyz/registry": {},
      "@hyperlane-xyz/utils": {},
    },
  },
  webpack: (config, { isServer }) => {
    // Only applies to webpack builds (dev mode with --webpack)
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      path: false,
      os: false,
      crypto: false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // starkzap optional peer dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      "@fatsolutions/tongo-sdk": false,
      "@solana/web3.js": false,
      "@hyperlane-xyz/sdk": false,
      "@hyperlane-xyz/registry": false,
      "@hyperlane-xyz/utils": false,
    };

    // Provide empty module for fs on client side
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
