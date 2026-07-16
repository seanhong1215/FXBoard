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
}: {
  value: string;
  codes: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm"
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
    <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900">
      <h2 className="text-lg font-semibold mb-4">
        換匯試算 <span className="text-neutral-500 text-sm">Converter</span>
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 tabular-nums"
            placeholder="金額 Amount"
          />
          <CurrencySelect value={from} codes={codes} onChange={setFrom} />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label="swap currencies"
            className="text-neutral-400 hover:text-white transition-colors text-lg"
          >
            ⇅
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 tabular-nums text-xl font-bold">
            {result !== null ? formatNumber(result, currencyDecimals(to)) : "—"}
          </div>
          <CurrencySelect value={to} codes={codes} onChange={setTo} />
        </div>
      </div>

      {oneUnit !== null && (
        <p className="mt-3 text-xs text-neutral-500">
          1 {from} = {formatRate(Number(oneUnit))} {to}
        </p>
      )}
      {!valid && (
        <p className="mt-1 text-xs text-red-400">請輸入有效金額 / Enter a valid amount</p>
      )}
    </div>
  );
}
