// GET /api/history?base=USD&symbols=EUR,JPY,...&days=8
// 區間走勢(BFF 代理 + TTL 快取)。一次請求含所有 symbols，避免 N+1。

import { cached } from "@/lib/cache";
import { fetchTimeSeries } from "@/lib/frankfurter";
import {
  parseFxQuery,
  parseHistoryDays,
  QueryValidationError,
} from "@/lib/api-query";
import {
  cacheHeaders,
  enforceRateLimit,
  validationError,
} from "@/lib/api-response";
import { serverConfig } from "@/lib/server-config";
import type { HistoryResponse, SeriesPoint } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  try {
    const searchParams = new URL(req.url).searchParams;
    const { base, symbols } = parseFxQuery(searchParams);
    const days = parseHistoryDays(searchParams);
    const key = `history:${base}:${[...symbols].sort().join(",")}:${days}`;

    const { value, hit } = await cached(key, serverConfig.historyTtlMs, () =>
      fetchTimeSeries(base, symbols, days)
    );

    // 把 { date: {SYM: v} } 轉成 { SYM: [{date,value}...] }，並依日期排序。
    const dates = Object.keys(value.rates).sort();
    const series: Record<string, SeriesPoint[]> = {};
    for (const sym of symbols) {
      const points: SeriesPoint[] = [];
      for (const date of dates) {
        const v = value.rates[date]?.[sym];
        if (typeof v === "number") points.push({ date, value: v });
      }
      // 只保留最後 days 個交易日
      series[sym] = points.slice(-days);
    }

    const body: HistoryResponse = {
      base: value.base,
      startDate: dates[0] ?? "",
      endDate: dates[dates.length - 1] ?? "",
      series,
      cached: hit,
    };
    return Response.json(body, {
      headers: cacheHeaders(serverConfig.historyTtlMs),
    });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return validationError(err.message);
    }
    console.error("[/api/history]", err);
    return Response.json(
      { error: "Failed to fetch history" },
      { status: 502 }
    );
  }
}
