export type YahooFinanceChart = {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
};

export type NormalizedQuote = {
  symbol: string;
  price: number;
  change: number;
  percent: number;
  history: number[];
};
