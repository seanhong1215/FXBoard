import { YahooFinanceChart } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return Response.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=15d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      }
    );

    const data: YahooFinanceChart = await res.json();

    if (data.chart?.error || !data.chart?.result?.[0]) {
      return Response.json(
        { symbol, price: 0, change: 0, percent: 0, history: [] },
        { status: 200 }
      );
    }

    const result = data.chart.result[0];
    const meta = result.meta;

    // 過濾掉 null 值（停市日）
    const closes: number[] = (result.indicators.quote[0].close ?? []).filter(
      (v): v is number => v !== null && v !== undefined
    );

    const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
    const previousClose = meta.chartPreviousClose ?? closes[closes.length - 2] ?? price;
    const change = price - previousClose;
    const percent = previousClose ? (change / previousClose) * 100 : 0;

    // 取最近 10 筆收盤價用於折線圖
    const history = closes.slice(-10);

    return Response.json({
      symbol: meta.symbol,
      price,
      change,
      percent,
      history,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { symbol, price: 0, change: 0, percent: 0, history: [] },
      { status: 500 }
    );
  }
}
