"use client";

import { useMemo, useState } from "react";
import { convertAmount, pairRate } from "@/lib/convert";
import { currencyMeta, currencyDecimals } from "@/lib/currencies";
import { formatNumber, formatRate } from "@/lib/format";

type ConverterProps = {
  /** 各幣別相對基準的匯率(基準本身為 1) */
  rates: Record<string, number>;
  base: string;
};

function CurrencySelect({
  value,
  codes,
  onChange,
  label,
}: {
  value: string;
  codes: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="field px-3 py-2 text-sm font-medium"
    >
      {codes.map((c) => (
        <option key={c} value={c}>
          {currencyMeta(c).flag} {c}
        </option>
      ))}
    </select>
  );
}

export default function Converter({ rates, base }: ConverterProps) {
  const codes = useMemo(() => Object.keys(rates).sort(), [rates]);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(base);
  const [to, setTo] = useState(codes.find((c) => c !== base) ?? base);

  const numeric = Number(amount);
  const valid = amount.trim() !== "" && !Number.isNaN(numeric) && numeric >= 0;

  const result = useMemo(() => {
    if (!valid || rates[from] == null || rates[to] == null) return null;
    return convertAmount(amount, rates[from], rates[to], currencyDecimals(to));
  }, [valid, amount, from, to, rates]);

  const oneUnit = useMemo(() => {
    if (rates[from] == null || rates[to] == null) return null;
    return pairRate(rates[from], rates[to], 6);
  }, [from, to, rates]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="card p-5">
      <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">
        換匯試算
        <span className="ml-2 text-xs font-normal text-[var(--ink-muted)]">
          Converter
        </span>
      </h2>

      <div className="mt-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field min-w-0 flex-1 px-3 py-2 text-[15px]"
            placeholder="金額 Amount"
            aria-label="金額"
          />
          <CurrencySelect
            value={from}
            codes={codes}
            onChange={setFrom}
            label="來源幣別"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label="交換幣別"
            className="hairline-btn grid h-8 w-8 place-items-center rounded-full text-sm"
          >
            ⇅
          </button>
        </div>

        <div className="flex items-center gap-2">
          <output
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2"
            aria-live="polite"
          >
            <span className="block truncate text-[22px] font-semibold text-[var(--ink-primary)]">
              {result !== null
                ? formatNumber(result, currencyDecimals(to))
                : "—"}
            </span>
          </output>
          <CurrencySelect
            value={to}
            codes={codes}
            onChange={setTo}
            label="目標幣別"
          />
        </div>
      </div>

      {oneUnit !== null && (
        <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
          1 {from} = {formatRate(Number(oneUnit))} {to}
        </p>
      )}
      {!valid && (
        <p className="mt-1 text-[11px]" style={{ color: "var(--delta-down)" }}>
          請輸入有效金額 / Enter a valid amount
        </p>
      )}

      <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        以 decimal.js 高精度運算,依幣別小數位進位(如 JPY 為 0 位),
        避免浮點誤差。
      </p>
    </div>
  );
}
