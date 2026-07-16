// FX 領域型別 / FX domain types

/** Frankfurter /latest 回應 */
export type FrankfurterLatest = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

/** Frankfurter 時間序列(區間)回應 */
export type FrankfurterTimeSeries = {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>; // { "2024-01-02": { EUR: 0.9 }, ... }
};

/** 前端使用的最新匯率(含資料時間與快取命中狀態) */
export type RatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
  cached: boolean;
};

/** 走勢圖用的單點 */
export type SeriesPoint = { date: string; value: number };

/** 前端使用的區間走勢(每個幣別一組序列) */
export type HistoryResponse = {
  base: string;
  startDate: string;
  endDate: string;
  /** { EUR: [{date,value}...], JPY: [...] } */
  series: Record<string, SeriesPoint[]>;
  cached: boolean;
};
