"use client";

import { currencyMeta } from "@/lib/currencies";
import { formatRate, formatPercent } from "@/lib/format";
import Sparkline from "./Sparkline";

export type RateCardData = {
  code: string;
  rate: number;
  changePct: number;
  history: number[];
};

type RateCardProps = RateCardData & {
  base: string;
  selected?: boolean;
  onSelect?: (code: string) => void;
};

/**
 * 匯率 stat tile:label(貨幣對)/ value(匯率)/ delta(帶符號漲跌)/ trend(迷你走勢)。
 * 漲跌以「+/− 符號 + 方向色」表達 — 顏色從不單獨承載意義。
 */
export default function RateCard({
  base,
  code,
  rate,
  changePct,
  history,
  selected,
  onSelect,
}: RateCardProps) {
  const meta = currencyMeta(code);
  const up = changePct >= 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(code)}
      aria-pressed={selected}
      className="card w-full p-4 text-left transition-shadow hover:shadow-sm"
      style={
        selected
          ? {
              borderColor: "var(--series-1)",
              boxShadow:
                "0 0 0 3px color-mix(in srgb, var(--series-1) 15%, transparent)",
            }
          : undefined
      }
    >
      {/* label 列:貨幣對 + delta */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none shrink-0">{meta.flag}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--ink-primary)]">
              {base}/{code}
            </div>
            <div className="truncate text-[11px] text-[var(--ink-muted)]">
              {meta.name}
            </div>
          </div>
        </div>
        <span
          className="shrink-0 text-xs font-semibold"
          style={{ color: up ? "var(--delta-up)" : "var(--delta-down)" }}
        >
          {formatPercent(changePct)}
        </span>
      </div>

      {/* value + trend */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-[var(--ink-primary)]">
          {formatRate(rate)}
        </div>
        <div className="h-9 w-[104px] shrink-0">
          {history.length > 1 && <Sparkline data={history} />}
        </div>
      </div>

      <div className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
        1 {base} = {formatRate(rate)} {code}
      </div>
    </button>
  );
}
