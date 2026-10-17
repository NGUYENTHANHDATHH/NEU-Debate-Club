import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lzefoyqkqqppbsyzmmuw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
