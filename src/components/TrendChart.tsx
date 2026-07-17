"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  type Plugin,
} from "chart.js";
import type { SeriesPoint } from "@/lib/types";
import { currencyMeta } from "@/lib/currencies";
import { formatRate } from "@/lib/format";
import { cssToken } from "@/lib/tokens";

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

/** 垂直 crosshair:hover 時追蹤最近的資料位置(hairline,不搶資料的戲)。 */
const crosshairPlugin: Plugin<"line"> = {
  id: "fxCrosshair",
  afterDatasetsDraw(chart) {
    const actives = chart.getActiveElements();
    if (!actives.length) return;
    const { top, bottom } = chart.chartArea;
    const x = actives[0].element.x;
    const ctx = chart.ctx;
    ctx.save();
    ctx.strokeStyle = cssToken("--baseline", "#c3c2b7");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  },
};

/** 端點直接標註:只標最後一個值(選擇性標註,其餘交給軸與 tooltip)。 */
const endLabelPlugin: Plugin<"line"> = {
  id: "fxEndLabel",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const last = meta.data[meta.data.length - 1];
    if (!last) return;
    const raw = chart.data.datasets[0].data as number[];
    const value = raw[raw.length - 1];
    if (value == null) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font =
      "600 11px var(--font-geist-sans), system-ui, -apple-system, sans-serif";
    ctx.fillStyle = cssToken("--ink-primary", "#0b0b0b");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(formatRate(value), last.x + 8, last.y);
    ctx.restore();
  },
};

export default function TrendChart({ base, quote, points }: TrendChartProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const series = cssToken("--series-1", "#2a78d6");
  const surface = cssToken("--surface", "#fcfcfb");
  const grid = cssToken("--grid", "#e1e0d9");
  const baseline = cssToken("--baseline", "#c3c2b7");
  const muted = cssToken("--ink-muted", "#898781");
  const inkPrimary = cssToken("--ink-primary", "#0b0b0b");
  const inkSecondary = cssToken("--ink-secondary", "#52514e");
  const areaWash = cssToken("--area-wash", "rgba(42,120,214,0.1)");
  const border = cssToken("--border", "rgba(11,11,11,0.1)");

  const values = points.map((p) => p.value);
  const lastIdx = values.length - 1;

  // 表格檢視:新→舊,附與前一日的差值(圖表的 WCAG 等價物)
  const tableRows = useMemo(
    () =>
      [...points]
        .map((p, i) => ({
          date: p.date,
          value: p.value,
          diff: i > 0 ? p.value - points[i - 1].value : null,
        }))
        .reverse(),
    [points]
  );

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">
            {currencyMeta(quote).flag} {base}/{quote} 走勢
            <span className="ml-2 text-xs font-normal text-[var(--ink-muted)]">
              Trend
            </span>
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
            {points[0]?.date} → {points[lastIdx]?.date}(ECB 每日參考匯率)
          </p>
        </div>
        <div className="seg shrink-0" role="group" aria-label="檢視切換">
          <button
            aria-pressed={view === "chart"}
            onClick={() => setView("chart")}
          >
            圖表
          </button>
          <button
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            表格
          </button>
        </div>
      </div>

      {view === "chart" ? (
        <div className="h-60">
          {points.length > 1 ? (
            <Line
              plugins={[crosshairPlugin, endLabelPlugin]}
              data={{
                labels: points.map((p) => p.date.slice(5)),
                datasets: [
                  {
                    data: values,
                    borderColor: series,
                    backgroundColor: areaWash,
                    borderWidth: 2,
                    borderJoinStyle: "round",
                    borderCapStyle: "round",
                    pointRadius: values.map((_, i) =>
                      i === lastIdx ? 4 : 0
                    ),
                    pointHoverRadius: 4,
                    pointBackgroundColor: series,
                    pointBorderColor: surface,
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: series,
                    pointHoverBorderColor: surface,
                    pointHoverBorderWidth: 2,
                    tension: 0.25,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                // crosshair 找 X:指到哪一天就顯示哪一天,不必命中 2px 線
                interaction: { mode: "index", intersect: false },
                layout: { padding: { right: 56, top: 8 } },
                plugins: {
                  legend: { display: false }, // 單一序列:標題已說明,無需圖例
                  tooltip: {
                    backgroundColor: surface,
                    borderColor: border,
                    borderWidth: 1,
                    titleColor: inkSecondary,
                    titleFont: { size: 11, weight: "normal" },
                    bodyColor: inkPrimary,
                    bodyFont: { size: 13, weight: 600 },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                      title: (items) => `${points[items[0].dataIndex].date}`,
                      label: (item) =>
                        `${formatRate(item.parsed.y ?? 0)} ${quote}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    border: { color: baseline },
                    ticks: {
                      color: muted,
                      font: { size: 11 },
                      maxRotation: 0,
                      autoSkipPadding: 16,
                    },
                  },
                  y: {
                    grid: { color: grid, lineWidth: 1 },
                    border: { display: false },
                    ticks: {
                      color: muted,
                      font: { size: 11 },
                      maxTicksLimit: 5,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-[var(--ink-muted)]">
              無足夠資料 / Not enough data
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-[var(--ink-muted)]">
                <th className="pb-2 font-normal">日期 Date</th>
                <th className="pb-2 text-right font-normal">
                  匯率 {base}/{quote}
                </th>
                <th className="pb-2 text-right font-normal">日變動 Δ</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {tableRows.map((r) => (
                <tr
                  key={r.date}
                  className="border-t border-[var(--border)] text-[var(--ink-primary)]"
                >
                  <td className="py-1.5 text-[var(--ink-secondary)]">
                    {r.date}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatRate(r.value)}
                  </td>
                  <td
                    className="py-1.5 text-right"
                    style={{
                      color:
                        r.diff == null
                          ? "var(--ink-muted)"
                          : r.diff >= 0
                            ? "var(--delta-up)"
                            : "var(--delta-down)",
                    }}
                  >
                    {r.diff == null
                      ? "—"
                      : `${r.diff >= 0 ? "+" : ""}${r.diff.toFixed(4)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
