/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  async redirects() {
    return [
      {
        source: '/portal',
        destination: '/student/portal',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: '/student/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
