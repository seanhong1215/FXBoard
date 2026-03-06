import { NormalizedQuote } from "./types";

export type StockQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percent: number;
  history: number[];
};

export async function fetchStock(symbol: string): Promise<StockQuote> {
  try {
    const res = await fetch(`/api/quote?symbol=${symbol}`);
    const data: NormalizedQuote = await res.json();

    return {
      symbol: data.symbol ?? symbol,
      name: symbol,
      price: data.price ?? 0,
      change: data.change ?? 0,
      percent: data.percent ?? 0,
      history: data.history ?? [],
    };
  } catch (err) {
    console.error(err);
    return { symbol, name: symbol, price: 0, change: 0, percent: 0, history: [] };
  }
}
