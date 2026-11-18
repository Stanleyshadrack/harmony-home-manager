/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: './dist',
  // Trusted development hosts for phone testing on the local Wi-Fi.
  allowedDevOrigins: ['192.168.100.6', '192.168.106.1'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8080/api/:path*',
      },
      {
        source: '/actuator/health',
        destination: 'http://127.0.0.1:8080/actuator/health',
      },
    ];
  },
};

export default nextConfig;
