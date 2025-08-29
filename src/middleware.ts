import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Excluded paths for static assets and images
const EXCLUDED_PREFIXES = [
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1) return null;
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    return { user, pass };
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth for excluded paths
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const envUser = process.env.BASIC_AUTH_USER || "";
  const envPass = process.env.BASIC_AUTH_PASS || "";

  // If envs are not set, deny by default (safer)
  if (!envUser || !envPass) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  const creds = parseBasicAuth(req.headers.get("authorization"));

  if (!creds || creds.user !== envUser || creds.pass !== envPass) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  return NextResponse.next();
}

// Apply middleware to all routes; we handle exclusions inside the middleware
export const config = {
  matcher: "/:path*",
};
