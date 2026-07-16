// 顯示格式化 / Display formatting

/** 依幣別以本地化格式輸出金額(含正確小數位與千分位)。 */
export function formatMoney(
  value: number | string,
  currency: string,
  decimals: number
): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/** 純數字金額(不帶貨幣符號)。 */
export function formatNumber(value: number | string, decimals: number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/** 匯率(固定 4 位,適合 pair 顯示)。 */
export function formatRate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

/** 漲跌百分比(帶正負號)。 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
