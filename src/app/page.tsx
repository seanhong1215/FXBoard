"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RateGrid from "@/components/RateGrid";
import Converter from "@/components/Converter";
import TrendChart from "@/components/TrendChart";
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
      // 錯誤韌性：保留前一次成功的資料，只顯示提示，不整頁清空。
      setError("資料更新失敗，顯示的是先前的資料 / Update failed, showing cached data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(base);
  }, [base, load]);

  // 由「最新匯率 + 區間走勢」組出每張卡片(single source，避免 N+1)。
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
    <main className="min-h-screen bg-black text-white px-5 sm:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            FXBoard
          </h1>
          <p className="text-neutral-400 mt-1">
            外匯即時儀表板與換匯試算 · Real-time FX dashboard &amp; converter
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            資料來源 / Data: European Central Bank via Frankfurter
          </p>
        </header>

        {/* 基準幣別切換 / Base currency */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm text-neutral-400 mr-1">基準幣別 Base：</span>
          {BASE_OPTIONS.map((b) => (
            <button
              key={b}
              onClick={() => setBase(b)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                base === b
                  ? "bg-sky-600 border-sky-500"
                  : "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
              }`}
            >
              {currencyMeta(b).flag} {b}
            </button>
          ))}
        </div>

        {/* 狀態列 / Status */}
        <div className="flex items-center gap-3 mb-6 text-xs text-neutral-500 min-h-[18px]">
          {rates && (
            <span>
              資料時間 {rates.date} ·{" "}
              {rates.cached ? "快取命中 cache hit" : "即時取得 fresh"}
            </span>
          )}
          {loading && <span className="text-sky-400">更新中… Updating…</span>}
          {error && <span className="text-amber-400">{error}</span>}
        </div>

        {!rates && loading ? (
          <div className="text-neutral-500">載入中… Loading…</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <RateGrid
                base={base}
                cards={cards}
                selected={selectedQuote}
                onSelect={setSelectedQuote}
              />
              {selectedQuote && (
                <div className="mt-6">
                  <TrendChart
                    base={base}
                    quote={selectedQuote}
                    points={trendPoints}
                  />
                </div>
              )}
            </section>

            <aside className="lg:col-span-1">
              {rates && <Converter rates={ratesMap} base={base} />}
              <p className="mt-3 text-[11px] text-neutral-600">
                換匯以 decimal.js 進行高精度運算，並依各幣別小數位進位（如 JPY 為 0 位）。
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
