// GET /api/rates?base=USD&symbols=EUR,JPY,...
// 最新匯率(BFF 代理 + TTL 快取)。一次請求含所有 symbols。

import { cached } from "@/lib/cache";
import { fetchLatest } from "@/lib/frankfurter";
import { parseFxQuery, QueryValidationError } from "@/lib/api-query";
import {
  cacheHeaders,
  enforceRateLimit,
  validationError,
} from "@/lib/api-response";
import { serverConfig } from "@/lib/server-config";
import type { RatesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const { base, symbols } = parseFxQuery(new URL(req.url).searchParams);
    const key = `latest:${base}:${[...symbols].sort().join(",")}`;

    const { value, hit } = await cached(key, serverConfig.ratesTtlMs, () =>
      fetchLatest(base, symbols)
    );

    const body: RatesResponse = {
      base: value.base,
      date: value.date,
      rates: value.rates,
      cached: hit,
    };
    return Response.json(body, {
      headers: cacheHeaders(serverConfig.ratesTtlMs),
    });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return validationError(err.message);
    }
    console.error("[/api/rates]", err);
    return Response.json(
      { error: "Failed to fetch rates" },
      { status: 502 }
    );
  }
}
