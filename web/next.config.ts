import type { NextConfig } from "next";

// The optional Python backend (real Connections hub) is proxied same-origin so its
// HttpOnly session cookie and CSRF token work without CORS.
const BACKEND = process.env.BACKEND_URL || "http://localhost:8082";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "maktechgroup.com" }] },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
  async redirects() {
    // OAuth callbacks in the backend redirect to the legacy page names.
    return [
      { source: "/app/connections.html", destination: "/app/connections", permanent: false },
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/login.html", destination: "/login", permanent: false },
      { source: "/signup.html", destination: "/signup", permanent: false },
      { source: "/pricing.html", destination: "/pricing", permanent: false },
    ];
  },
};

export default nextConfig;
