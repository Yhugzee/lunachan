import type { NextApiRequest, NextApiResponse } from "next";

interface RateLimitOptions {
  windowMs?: number; // default 60_000
  max?: number; // default 30
  keyGenerator?: (req: NextApiRequest) => string;
}

interface State {
  count: number;
  resetAt: number; // timestamp in ms
}

const store = new Map<string, State>();

function defaultKey(req: NextApiRequest): string {
  const xff = (req.headers["x-forwarded-for"] || "") as string;
  const ip = Array.isArray(xff) ? xff[0] : xff.split(",")[0].trim();
  const remote = (req.socket as { remoteAddress?: string } | undefined)?.remoteAddress || "unknown";
  return ip || remote || "unknown";
}

export async function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: RateLimitOptions = {},
): Promise<boolean> {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 30;
  const key = (opts.keyGenerator ?? defaultKey)(req);

  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    // Initialize or reset the window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    setHeaders(res, max, max - 1, resetAt);
    return true;
  }

  // Existing window
  if (current.count >= max) {
    setHeaders(res, max, 0, current.resetAt);
    res.status(429).json({ success: false, message: "Trop de requêtes" });
    return false;
  }

  current.count += 1;
  store.set(key, current);
  setHeaders(res, max, Math.max(0, max - current.count), current.resetAt);
  return true;
}

function setHeaders(
  res: NextApiResponse,
  limit: number,
  remaining: number,
  resetAt: number,
) {
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  // Use UNIX seconds for reset for better compatibility
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
}
