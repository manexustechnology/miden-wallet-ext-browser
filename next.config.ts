import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@demox-labs/miden-sdk'],
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name][ext]'
      }
    });

    // Resolve fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ensure Miden SDK is only loaded on client side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@demox-labs/miden-sdk');
    }

    return config;
  },
};

export default nextConfig;
