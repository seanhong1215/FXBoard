"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import type { SeriesPoint } from "@/lib/types";
import { currencyMeta } from "@/lib/currencies";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler
);

type TrendChartProps = {
  base: string;
  quote: string;
  points: SeriesPoint[];
};

export default function TrendChart({ base, quote, points }: TrendChartProps) {
  const values = points.map((p) => p.value);
  const up = values.length > 1 && values[values.length - 1] >= values[0];
  const color = up ? "rgb(34,197,94)" : "rgb(239,68,68)";

  return (
    <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {base}/{quote} 走勢{" "}
          <span className="text-neutral-500 text-sm">
            {currencyMeta(quote).flag} Trend
          </span>
        </h2>
        <span className="text-xs text-neutral-500">
          {points[0]?.date} → {points[points.length - 1]?.date}
        </span>
      </div>

      <div className="h-56">
        {points.length > 1 ? (
          <Line
            data={{
              labels: points.map((p) => p.date.slice(5)),
              datasets: [
                {
                  data: values,
                  borderColor: color,
                  backgroundColor: "rgba(56,189,248,0.08)",
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0.25,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: "#737373", maxRotation: 0 }, grid: { display: false } },
                y: {
                  ticks: { color: "#737373" },
                  grid: { color: "rgba(115,115,115,0.15)" },
                },
              },
            }}
          />
        ) : (
          <div className="h-full grid place-items-center text-neutral-600 text-sm">
            無足夠資料 / Not enough data
          </div>
        )}
      </div>
    </div>
  );
}
