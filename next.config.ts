import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const publicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME || ""; // ex: "pub-xxxxx.r2.dev" ou "cdn.lunachan.xyz"

const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  // Tous les sous-domaines *.r2.dev (pratique si tu changes de bucket public)
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
  // Cloudflare R2 "endpoint" direct (au cas où tu sers via cloudflarestorage.com)
  {
    protocol: "https",
    hostname: "*.r2.cloudflarestorage.com",
    pathname: "/**",
  },
];

if (publicHost) {
  patterns.push({ protocol: "https", hostname: publicHost, pathname: "/**" });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: patterns },
};

export default withSentryConfig(nextConfig, {
  org: "liyhu-studio",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  widenClientFileUpload: true,
  automaticVercelMonitors: true,
});
