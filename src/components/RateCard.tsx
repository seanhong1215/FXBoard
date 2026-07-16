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
      className={`w-full text-left p-4 rounded-xl border transition-colors bg-neutral-900 hover:border-neutral-600 ${
        selected ? "border-sky-500 ring-1 ring-sky-500/40" : "border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{meta.flag}</span>
          <div>
            <div className="font-semibold">
              {base}/{code}
            </div>
            <div className="text-xs text-neutral-400">{meta.name}</div>
          </div>
        </div>
        <span
          className={`text-xs font-medium ${
            up ? "text-green-400" : "text-red-400"
          }`}
        >
          {formatPercent(changePct)}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-bold tabular-nums">
          {formatRate(rate)}
        </div>
        <div className="h-10 flex-1 max-w-[120px]">
          {history.length > 1 ? (
            <Sparkline data={history} up={up} />
          ) : (
            <div className="h-full" />
          )}
        </div>
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        1 {base} = {formatRate(rate)} {code}
      </div>
    </button>
  );
}
