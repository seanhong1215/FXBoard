// GET /api/rates?base=USD&symbols=EUR,JPY,...
// 最新匯率(BFF 代理 + TTL 快取)。一次請求含所有 symbols。

import { cached } from "@/lib/cache";
import { fetchLatest } from "@/lib/frankfurter";
import { quoteSymbolsFor, DEFAULT_BASE } from "@/lib/currencies";
import type { RatesResponse } from "@/lib/types";

// 匯率變動不快，但要保持「即時感」→ 60 秒 TTL。
const TTL_MS = 60_000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") ?? DEFAULT_BASE).toUpperCase();
  const symbols = searchParams.get("symbols")
    ? searchParams.get("symbols")!.toUpperCase().split(",").filter(Boolean)
    : quoteSymbolsFor(base);

  const key = `latest:${base}:${symbols.sort().join(",")}`;

  try {
    const { value, hit } = await cached(key, TTL_MS, () =>
      fetchLatest(base, symbols)
    );

    const body: RatesResponse = {
      base: value.base,
      date: value.date,
      rates: value.rates,
      cached: hit,
    };
    return Response.json(body);
  } catch (err) {
    console.error("[/api/rates]", err);
    return Response.json(
      { error: "Failed to fetch rates" },
      { status: 502 }
    );
  }
}
