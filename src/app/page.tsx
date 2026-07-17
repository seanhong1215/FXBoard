"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RateGrid from "@/components/RateGrid";
import Converter from "@/components/Converter";
import TrendChart from "@/components/TrendChart";
import ThemeToggle from "@/components/ThemeToggle";
import type { RateCardData } from "@/components/RateCard";
import type { RatesResponse, HistoryResponse } from "@/lib/types";
import {
  BASE_OPTIONS,
  DEFAULT_BASE,
  quoteSymbolsFor,
  currencyMeta,
} from "@/lib/currencies";
import { percentChange } from "@/lib/convert";

const HISTORY_DAYS = 8;

export default function Home() {
  const [base, setBase] = useState(DEFAULT_BASE);
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 主題切換時圖表需以新 token 重繪(canvas 讀不到 CSS 變數)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const load = useCallback(async (b: string) => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, hRes] = await Promise.all([
        fetch(`/api/rates?base=${b}`),
        fetch(`/api/history?base=${b}&days=${HISTORY_DAYS}`),
      ]);
      if (!rRes.ok || !hRes.ok) throw new Error("API error");
      const rData: RatesResponse = await rRes.json();
      const hData: HistoryResponse = await hRes.json();
      setRates(rData);
      setHistory(hData);
    } catch (err) {
      console.error(err);
      // 錯誤韌性:保留前一次成功的資料,只顯示提示,不整頁清空。
      setError("資料更新失敗,顯示先前資料 / Update failed, showing cached data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(base);
  }, [base, load]);

  // 由「最新匯率 + 區間走勢」組出每張卡片(single source,避免 N+1)。
  const cards: RateCardData[] = useMemo(() => {
    if (!rates) return [];
    return quoteSymbolsFor(base)
      .filter((code) => rates.rates[code] != null)
      .map((code) => {
        const series = history?.series[code] ?? [];
        const values = series.map((p) => p.value);
        const prev = values.length >= 2 ? values[values.length - 2] : values[0];
        const last = rates.rates[code];
        return {
          code,
          rate: last,
          changePct: prev ? percentChange(last, prev) : 0,
          history: values,
        };
      });
  }, [rates, history, base]);

  // 換匯試算用的匯率表(含基準本身 = 1)。
  const ratesMap: Record<string, number> = useMemo(() => {
    if (!rates) return {};
    return { [base]: 1, ...rates.rates };
  }, [rates, base]);

  // 預設走勢圖顯示第一張卡片的幣別。
  useEffect(() => {
    if (cards.length && !cards.some((c) => c.code === selectedQuote)) {
      setSelectedQuote(cards[0].code);
    }
  }, [cards, selectedQuote]);

  const trendPoints = history?.series[selectedQuote] ?? [];

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ---- header ---- */}
        <header className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[var(--ink-primary)]">
              FXBoard
            </h1>
            <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
              外匯即時儀表板與換匯試算 · Real-time FX dashboard
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              資料來源:European Central Bank(via Frankfurter)
            </p>
          </div>
          <ThemeToggle onChange={setTheme} />
        </header>

        {/* ---- 篩選列:一列,置於所有內容之上,範圍涵蓋以下全部 ---- */}
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-[var(--ink-secondary)]">
            基準幣別 Base
          </span>
          <div className="seg" role="group" aria-label="基準幣別">
            {BASE_OPTIONS.map((b) => (
              <button
                key={b}
                aria-pressed={base === b}
                onClick={() => setBase(b)}
              >
                {currencyMeta(b).flag} {b}
              </button>
            ))}
          </div>
        </div>

        {/* ---- 狀態列 ---- */}
        <div className="mb-6 flex min-h-[18px] flex-wrap items-center gap-3 text-[11px] text-[var(--ink-muted)]">
          {rates && (
            <span>
              資料時間 {rates.date} ·{" "}
              {rates.cached ? "快取命中 cache hit" : "即時取得 fresh"}
            </span>
          )}
          {loading && (
            <span className="text-[var(--ink-secondary)]">更新中…</span>
          )}
          {error && (
            <span
              className="inline-flex items-center gap-1 font-medium"
              style={{ color: "var(--status-warning)" }}
            >
              <span aria-hidden>⚠</span> {error}
            </span>
          )}
        </div>

        {!rates && loading ? (
          <div className="text-sm text-[var(--ink-muted)]">載入中… Loading…</div>
        ) : (
          /* 重新載入時保持前一次渲染,僅降低透明度 — 不閃骨架屏 */
          <div
            className="grid gap-5 transition-opacity lg:grid-cols-3"
            style={{ opacity: loading && rates ? 0.6 : 1 }}
          >
            <section className="lg:col-span-2">
              <RateGrid
                base={base}
                cards={cards}
                selected={selectedQuote}
                onSelect={setSelectedQuote}
              />
              {selectedQuote && (
                <div className="mt-5">
                  <TrendChart
                    key={`${theme}-${base}-${selectedQuote}`}
                    base={base}
                    quote={selectedQuote}
                    points={trendPoints}
                  />
                </div>
              )}
            </section>

            <aside className="lg:col-span-1">
              {rates && <Converter rates={ratesMap} base={base} />}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
