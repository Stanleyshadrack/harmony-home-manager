/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Build as static SPA
  distDir: './dist', // Where to output build files

  async rewrites() {
    return [
      {
        source: '/actuator/health',
        destination: 'http://127.0.0.1:8080/actuator/health',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8080/api/:path*',
      },
      {
        source: '/:path*',
        destination: '/', // Always serve index.html (fixes /dashboard refresh)
      },
    ];
  },
};

export default nextConfig;
