import { clientKey, checkRateLimit } from "./rate-limit";
import { serverConfig } from "./server-config";

export function enforceRateLimit(request: Request): Response | null {
  const result = checkRateLimit(
    clientKey(request),
    serverConfig.rateLimitMax,
    serverConfig.rateLimitWindowMs
  );

  if (result.allowed) return null;
  return Response.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}

export function validationError(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function cacheHeaders(ttlMs: number): HeadersInit {
  const seconds = Math.max(Math.floor(ttlMs / 1_000), 1);
  return {
    "Cache-Control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 5}`,
  };
}
