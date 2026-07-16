// 幣別中繼資料 / Currency metadata
// 資料來源匯率為歐洲央行(ECB)參考匯率，透過 Frankfurter API 取得。
// 注意：ECB 清單「不包含」TWD，故預設幣別以主要國際貨幣為主。

export type CurrencyMeta = {
  code: string;
  name: string;
  flag: string;
  /** 顯示金額時的小數位數（多數幣別 2 位，日圓/韓元為 0 位） */
  decimals: number;
};

// 大多數貨幣顯示 2 位小數，少數（無輔幣單位）為 0 位。
const ZERO_DECIMAL = new Set(["JPY", "KRW", "HUF", "ISK"]);

const META: Record<string, { name: string; flag: string }> = {
  USD: { name: "美元 US Dollar", flag: "🇺🇸" },
  EUR: { name: "歐元 Euro", flag: "🇪🇺" },
  JPY: { name: "日圓 Japanese Yen", flag: "🇯🇵" },
  GBP: { name: "英鎊 British Pound", flag: "🇬🇧" },
  CNY: { name: "人民幣 Chinese Yuan", flag: "🇨🇳" },
  HKD: { name: "港幣 Hong Kong Dollar", flag: "🇭🇰" },
  AUD: { name: "澳幣 Australian Dollar", flag: "🇦🇺" },
  CAD: { name: "加幣 Canadian Dollar", flag: "🇨🇦" },
  CHF: { name: "瑞士法郎 Swiss Franc", flag: "🇨🇭" },
  SGD: { name: "新加坡幣 Singapore Dollar", flag: "🇸🇬" },
  KRW: { name: "韓元 South Korean Won", flag: "🇰🇷" },
  NZD: { name: "紐幣 New Zealand Dollar", flag: "🇳🇿" },
};

/** 儀表板預設顯示的幣別池（皆為 ECB 支援幣別）。 */
export const POPULAR_CURRENCIES = [
  "USD",
  "EUR",
  "JPY",
  "GBP",
  "CNY",
  "HKD",
  "AUD",
  "CAD",
  "CHF",
  "SGD",
  "KRW",
];

/** 使用者可選的基準幣別。 */
export const BASE_OPTIONS = ["USD", "EUR", "JPY", "GBP", "CNY"];

export const DEFAULT_BASE = "USD";

export function currencyMeta(code: string): CurrencyMeta {
  const m = META[code];
  return {
    code,
    name: m?.name ?? code,
    flag: m?.flag ?? "🏳️",
    decimals: ZERO_DECIMAL.has(code) ? 0 : 2,
  };
}

export function currencyDecimals(code: string): number {
  return ZERO_DECIMAL.has(code) ? 0 : 2;
}

/**
 * 依基準幣別回傳要查詢的報價幣別清單（排除基準本身）。
 * base 若不在熱門池內也沒關係，會單純把整個池扣掉 base。
 */
export function quoteSymbolsFor(base: string): string[] {
  return POPULAR_CURRENCIES.filter((c) => c !== base);
}
