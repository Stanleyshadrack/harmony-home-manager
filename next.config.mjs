/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: './dist', // Where to output build files

  async rewrites() {
    return [
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
