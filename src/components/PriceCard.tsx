"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

type PriceCardProps = {
  name: string;
  price: number;
  change: number;
  percent: number;
  history: number[];
};

export default function PriceCard({ name, price, change, percent, history }: PriceCardProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    // 使用微任務包裹 setFlash，避免同步觸發
    Promise.resolve().then(() => {
      if (change > 0) setFlash("up");
      else if (change < 0) setFlash("down");
    });

    const timeout = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timeout);
  }, [change]);

  return (
    <div className={`p-4 rounded-lg shadow-md bg-neutral-900 transition-colors ${flash === "up" ? "bg-green-800" : flash === "down" ? "bg-red-800" : ""}`}>
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-2xl font-bold">{price.toFixed(2)}</p>
      <p className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
        {change >= 0 ? "+" : ""}{change.toFixed(2)} ({percent.toFixed(2)}%)
      </p>
      <div className="mt-2">
        <Line
          data={{
            labels: history.map((_, i) => i + 1),
            datasets: [
              {
                data: history,
                borderColor: change >= 0 ? "rgb(34,197,94)" : "rgb(239,68,68)",
                backgroundColor: "transparent",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
          }}
        />
      </div>
    </div>
  );
}