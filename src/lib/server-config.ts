import "server-only";

function integerEnv(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function apiBaseUrl() {
  const raw = process.env.FX_API_BASE ?? "https://api.frankfurter.dev/v1";
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error("FX_API_BASE must use HTTPS");
  }
  return url.toString().replace(/\/$/, "");
}

export const serverConfig = {
  apiBaseUrl: apiBaseUrl(),
  apiTimeoutMs: integerEnv("FX_API_TIMEOUT_MS", 8_000, 1_000, 30_000),
  ratesTtlMs: integerEnv("FX_RATES_TTL_MS", 60_000, 5_000, 3_600_000),
  historyTtlMs: integerEnv(
    "FX_HISTORY_TTL_MS",
    3_600_000,
    60_000,
    86_400_000
  ),
  rateLimitMax: integerEnv("FX_RATE_LIMIT_MAX", 60, 1, 1_000),
  rateLimitWindowMs: integerEnv(
    "FX_RATE_LIMIT_WINDOW_MS",
    60_000,
    1_000,
    3_600_000
  ),
};
