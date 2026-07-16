"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

type SparklineProps = {
  data: number[];
  up: boolean;
};

/** 卡片內的迷你走勢線(無座標軸)。 */
export default function Sparkline({ data, up }: SparklineProps) {
  return (
    <Line
      data={{
        labels: data.map((_, i) => i + 1),
        datasets: [
          {
            data,
            borderColor: up ? "rgb(34,197,94)" : "rgb(239,68,68)",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        animation: false,
      }}
    />
  );
}
