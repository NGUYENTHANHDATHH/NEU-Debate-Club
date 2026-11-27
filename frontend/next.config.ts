import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Ảnh CMS (/media/*) nằm trong MinIO; production do Caddy chuyển, dev không có Caddy nên Next chuyển hộ.
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/media/:path*", destination: "http://localhost:9000/media/:path*" }]
      : [];
  },
  // Keep the dashboard out of search results without naming it in robots.txt.
  async headers() {
    return [
      {
        source: "/dashboard/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
