/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

export default nextConfig;
