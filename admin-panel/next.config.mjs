/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/privacidad',
        destination: '/politica-privacidad.html',
      },
      {
        source: '/terminos',
        destination: '/terminos-condiciones.html',
      },
    ];
  },
};

export default nextConfig;
