import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in development to avoid warnings
  productionBrowserSourceMaps: false,

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle canvas for pdf-parse on server
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }

    // Ignore source map warnings for node_modules
    config.ignoreWarnings = [
      { module: /node_modules/ },
      /Failed to parse source map/,
      /Invalid source map/,
    ];

    return config;
  },

  // Suppress Turbopack webpack config warning
  turbopack: {},
};

export default nextConfig;
