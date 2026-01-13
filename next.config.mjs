/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Build as static SPA
  distDir: './dist', // Where to output build files

  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/', // Always serve index.html (fixes /dashboard refresh)
      },
    ];
  },
};

export default nextConfig;
