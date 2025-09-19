import type { NextConfig } from "next";

const publicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME ?? "";

const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  // Tous les sous-domaines R2 publics
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
  // Endpoints directs Cloudflare R2
  {
    protocol: "https",
    hostname: "**.r2.cloudflarestorage.com",
    pathname: "/**",
  },
];

if (publicHost) {
  // ex: "pub-5483364617624961a8800c235140a1ed.r2.dev" (hostname seul)
  patterns.push({ protocol: "https", hostname: publicHost, pathname: "/**" });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: patterns },
};

export default nextConfig;
