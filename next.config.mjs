/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Production (Vercel): vercel.json handles /api. Only proxy locally.
    if (process.env.NODE_ENV !== "development") return [];
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" },
    ];
  },
};
export default nextConfig;