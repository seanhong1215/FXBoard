type Bucket = { count: number; resetsAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5_000;

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetsAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (oldestKey) buckets.delete(oldestKey);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  pruneBuckets(now);
  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetsAt > now
      ? existing
      : { count: 0, resetsAt: now + windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= max,
    remaining: Math.max(max - bucket.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((bucket.resetsAt - now) / 1_000), 1),
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}

export function clearRateLimits() {
  buckets.clear();
}
