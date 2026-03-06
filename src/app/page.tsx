"use client";

import { useEffect, useState } from "react";
import PriceCard from "@/components/PriceCard";
import { mockTWStocks, MockStock } from "@/lib/mockTWStocks";
import { fetchStock, StockQuote } from "@/lib/fetchStock";

const SP500Symbols = [
  "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA", "BRK.B", "JNJ", "V",
  "WMT", "PG", "UNH", "HD", "DIS", "MA", "PYPL", "BAC", "VZ", "ADBE",
  "CMCSA", "NFLX", "XOM", "KO", "INTC", "CSCO", "PEP", "T", "ABT", "CRM"
]; // 前 30 檔

export default function Home() {
  const [activeTab, setActiveTab] = useState<"TW" | "US">("TW");
  const [usQuotes, setUsQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(false);

  // SP500 資料
useEffect(() => {
  let isMounted = true;

  const fetchUSQuotes = async () => {
    setLoading(true); // 可以先設定 loading
    try {
      const results = await Promise.all(SP500Symbols.map(s => fetchStock(s)));
      if (isMounted) setUsQuotes(results);
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  if (activeTab === "US") {
    fetchUSQuotes();
  }

  return () => {
    isMounted = false; // cleanup
  };
}, [activeTab]);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold mb-8 tracking-tight">Market Dashboard</h1>

        {/* Tabs */}
        <div className="flex mb-6">
          <button
            className={`mr-4 px-4 py-2 rounded ${activeTab === "TW" ? "bg-green-600" : "bg-neutral-800"}`}
            onClick={() => setActiveTab("TW")}
          >
            0050 (TW)
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === "US" ? "bg-blue-600" : "bg-neutral-800"}`}
            onClick={() => setActiveTab("US")}
          >
            SP500 (US)
          </button>
        </div>

        {/* Content */}
        {activeTab === "TW" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTWStocks.map(stock => (
              <PriceCard
                key={stock.symbol}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                percent={stock.percent}
                history={stock.history}
              />
            ))}
          </div>
        )}

        {activeTab === "US" && (
          loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usQuotes.map(stock => (
                <PriceCard
                  key={stock.symbol}
                  name={stock.name}
                  price={stock.price}
                  change={stock.change}
                  percent={stock.percent}
                  history={stock.history}
                />
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}