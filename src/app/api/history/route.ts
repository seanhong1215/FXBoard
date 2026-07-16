// GET /api/history?base=USD&symbols=EUR,JPY,...&days=8
// 區間走勢(BFF 代理 + TTL 快取)。一次請求含所有 symbols，避免 N+1。

import { cached } from "@/lib/cache";
import { fetchTimeSeries } from "@/lib/frankfurter";
import { quoteSymbolsFor, DEFAULT_BASE } from "@/lib/currencies";
import type { HistoryResponse, SeriesPoint } from "@/lib/types";

// 歷史每日資料變動極少 → 較長 TTL(1 小時)。
const TTL_MS = 60 * 60_000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? DEFAULT_BASE).toUpperCase();
  const symbols = searchParams.get("symbols")
    ? searchParams.get("symbols")!.toUpperCase().split(",").filter(Boolean)
    : quoteSymbolsFor(base);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 8, 2), 90);

  const key = `history:${base}:${symbols.sort().join(",")}:${days}`;

  try {
    const { value, hit } = await cached(key, TTL_MS, () =>
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
    return Response.json(body);
  } catch (err) {
    console.error("[/api/history]", err);
    return Response.json(
      { error: "Failed to fetch history" },
      { status: 502 }
    );
  }
}
