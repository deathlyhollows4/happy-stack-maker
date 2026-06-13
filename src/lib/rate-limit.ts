// In-memory rate limiter for Cloudflare Workers (Durable Object alternative)
// Uses a Map with per-IP counters that auto-expire

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  for (const [ip, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(ip);
  }
}

export function checkRateLimit(
  ip: string,
  limit = MAX_REQUESTS,
): { allowed: boolean; resetIn: number } {
  const now = Date.now();

  // Opportunistic cleanup on each call (no global timers in Workers)
  if (buckets.size > 100) cleanup(now);

  const bucket = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, resetIn: WINDOW_MS };
  }

  if (bucket.count >= limit) {
    return { allowed: false, resetIn: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, resetIn: bucket.resetAt - now };
}


export function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
