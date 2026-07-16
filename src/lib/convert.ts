// 換匯計算(高精度) / Currency conversion with decimal precision
//
// 為什麼金融不能用 JavaScript 原生浮點數：
//   0.1 + 0.2 === 0.30000000000000004   // ← 二進位浮點數的表示誤差
// 在換匯、對帳、計息場景，這種誤差會「累積」成真實的金額差異。
// 因此本模組所有金額運算一律走 decimal.js，並依各幣別的小數位數進位。

import Decimal from "decimal.js";

/**
 * 把「以基準幣別表示的匯率表」中的兩個幣別互相換算。
 *
 * rates 為相對於某個基準的匯率(基準幣別本身的匯率視為 1)。
 * 換算公式：先把 from 金額還原成基準值，再換算到 to。
 *   基準值 = amount / rate[from]
 *   結果   = 基準值 * rate[to]
 *
 * @param amount    來源金額(可為字串以保留精度)
 * @param fromRate  來源幣別相對基準的匯率
 * @param toRate    目標幣別相對基準的匯率
 * @param decimals  目標幣別的顯示小數位數(如 JPY=0)
 * @returns 進位後的字串金額(四捨五入 half-up)
 */
export function convertAmount(
  amount: Decimal.Value,
  fromRate: Decimal.Value,
  toRate: Decimal.Value,
  decimals: number
): string {
  const from = new Decimal(fromRate);
  if (from.isZero()) {
    throw new Error("fromRate must not be zero");
  }
  const baseValue = new Decimal(amount).div(from);
  const result = baseValue.mul(new Decimal(toRate));
  return result.toFixed(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * 直接以「1 來源 = rate 目標」的匯率換算(base→quote 的常見情況)。
 */
export function applyRate(
  amount: Decimal.Value,
  rate: Decimal.Value,
  decimals: number
): string {
  return new Decimal(amount)
    .mul(new Decimal(rate))
    .toFixed(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * 計算「1 單位 from 等於多少 to」的匯率(供介面顯示 pair rate)。
 */
export function pairRate(
  fromRate: Decimal.Value,
  toRate: Decimal.Value,
  decimals = 6
): string {
  const from = new Decimal(fromRate);
  if (from.isZero()) {
    throw new Error("fromRate must not be zero");
  }
  return new Decimal(toRate).div(from).toFixed(decimals, Decimal.ROUND_HALF_UP);
}

/** 百分比變化(以字串精度計算後回傳 number 供顯示)。 */
export function percentChange(current: number, previous: number): number {
  if (!previous) return 0;
  return new Decimal(current)
    .minus(previous)
    .div(previous)
    .mul(100)
    .toNumber();
}
