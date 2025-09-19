import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const publicHost = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME || "";

const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  // Tous les *.r2.dev
  { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
  // Endpoints R2 directs
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
