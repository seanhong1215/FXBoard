"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { cssToken } from "@/lib/tokens";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

type SparklineProps = {
  data: number[];
};

/**
 * 卡片內的迷你走勢(stat tile 的 trend 元素)。
 * 依 dataviz 規範:走勢線用「低調色」,只有目前端點用系列色 + 表面色圓環;
 * 漲跌方向交給旁邊帶正負號的 delta 文字,不用線色表達。
 */
export default function Sparkline({ data }: SparklineProps) {
  const spark = cssToken("--spark", "#9ec5f4");
  const accent = cssToken("--series-1", "#2a78d6");
  const surface = cssToken("--surface", "#fcfcfb");
  const last = data.length - 1;

  return (
    <Line
      data={{
        labels: data.map((_, i) => i + 1),
        datasets: [
          {
            data,
            borderColor: spark,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderJoinStyle: "round",
            borderCapStyle: "round",
            pointRadius: data.map((_, i) => (i === last ? 3.5 : 0)),
            pointBackgroundColor: accent,
            pointBorderColor: surface,
            pointBorderWidth: 2,
            tension: 0.3,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        events: [], // 純裝飾性趨勢,數值由走勢圖與表格檢視提供
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        layout: { padding: 4 },
        animation: false,
      }}
    />
  );
}
