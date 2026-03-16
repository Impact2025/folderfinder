import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Albert Heijn product images
      { protocol: 'https', hostname: 'static.ah.nl' },
      { protocol: 'https', hostname: 'images.albertheijn.nl' },
      // Jumbo product images
      { protocol: 'https', hostname: 'assets.jumbo.com' },
      { protocol: 'https', hostname: 'www.jumbo.com' },
      // Generic CDN patterns
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: '*.imgix.net' },
    ],
  },
  serverExternalPackages: ['pg'],
};

export default nextConfig;
