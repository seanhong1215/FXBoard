// Frankfurter API 封裝(伺服器端) / Frankfurter API client (server-side)
//
// Frankfurter 提供歐洲央行(ECB)參考匯率，免費、免金鑰、支援歷史區間。
// 這個模組只在伺服器端(API Route)使用，前端一律透過我們自己的 /api 代理。
//
// 關鍵設計：時間序列端點支援「一次帶多個 symbols」，因此整個儀表板
// 不論顯示幾種幣別，最新匯率 + 走勢各只需 1 次外部請求(避免 N+1)。

import type { FrankfurterLatest, FrankfurterTimeSeries } from "./types";

const BASE_URL = process.env.FX_API_BASE ?? "https://api.frankfurter.dev/v1";

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 取得最新匯率(單一請求含所有 symbols)。 */
export async function fetchLatest(
  base: string,
  symbols: string[]
): Promise<FrankfurterLatest> {
  const url = `${BASE_URL}/latest?base=${encodeURIComponent(
    base
  )}&symbols=${encodeURIComponent(symbols.join(","))}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Frankfurter latest failed: ${res.status}`);
  }
  return (await res.json()) as FrankfurterLatest;
}

/**
 * 取得最近 N 天的區間走勢(單一請求含所有 symbols)。
 * 多抓幾天以涵蓋週末/假日無報價的情形，前端再取實際有資料的點。
 */
export async function fetchTimeSeries(
  base: string,
  symbols: string[],
  days: number
): Promise<FrankfurterTimeSeries> {
  const end = new Date();
  const start = new Date();
  // 週末無 ECB 報價，抓 days * 2 天緩衝以確保有足夠交易日資料。
  start.setDate(end.getDate() - Math.max(days * 2, days + 4));

  const url = `${BASE_URL}/${toYmd(start)}..${toYmd(
    end
  )}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(
    symbols.join(",")
  )}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Frankfurter timeseries failed: ${res.status}`);
  }
  return (await res.json()) as FrankfurterTimeSeries;
}
