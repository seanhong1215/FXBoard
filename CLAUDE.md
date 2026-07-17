# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

FXBoard — 外匯即時儀表板與換匯試算。Next.js 16(App Router)+ React 19 + TypeScript + Tailwind 4 + Chart.js 4。資料來源是 **Frankfurter API**(歐洲央行 ECB 參考匯率,免金鑰),一律經由自家 API Route(BFF 代理 + TTL 快取)取得,前端不直接打外部 API。本專案由舊的股票 demo 重寫而來,repo 名稱仍是 `stock-dashboard`,但內容已與股票無關。

## 常用指令

```bash
npm run dev      # 開發伺服器 http://localhost:3000
npm run build    # 正式打包(Turbopack;會跑 TS 型別檢查)
npm run start    # 啟動正式版(可加 -- -p 3005 換埠)
npm run lint     # ESLint
npm run test     # Vitest 單元測試(vitest run)
```

CI(`.github/workflows/ci.yml`)在 push/PR 跑 `lint → test → build`,用 `npm ci`——改依賴時 `package-lock.json` 必須一起 commit。

## 架構

### BFF + 快取層(核心賣點,不要繞過)
- `src/app/api/rates/route.ts`(TTL 60s)與 `src/app/api/history/route.ts`(TTL 1h)是唯二對外取數的地方,都經過 `src/lib/cache.ts` 的 in-memory TTL 快取。
- **一次請求帶齊所有幣別**(Frankfurter 的 `symbols=` 逗號分隔;時間序列端點同樣支援),不論顯示幾種幣別,最新匯率 + 走勢各只需 1 次外部請求——不要改成逐幣別打 API(N+1)。
- `cache.ts` 刻意把時鐘做成可注入(`__setNow`/`__resetNow`),測試用假時鐘驗證 TTL 過期,不要移除。
- 回應帶 `cached: true/false`,前端狀態列會顯示「快取命中/即時取得」。

### 金額精度(金融鐵律)
- 換匯運算一律走 `src/lib/convert.ts`(decimal.js),**絕不用原生浮點加減乘除金額**;進位依 `currencies.ts` 的 `currencyDecimals()`(JPY/KRW/HUF/ISK 為 0 位,其餘 2 位)。
- 新增金額相關邏輯時比照辦理,並在 `convert.test.ts` 補測試。

### 幣別清單(`src/lib/currencies.ts`)
- **ECB 不支援 TWD**——Frankfurter 的清單只有 30 種主要貨幣,不要把 TWD 加進 `POPULAR_CURRENCIES` 或 `BASE_OPTIONS`,加了只會拿到空資料。
- 週末/假日 ECB 無報價:`frankfurter.ts` 的 `fetchTimeSeries()` 抓 `days * 2` 天緩衝再取尾端 `days` 筆,是刻意的,不要「優化」掉。

## 設計系統(重新設計後的約定)

### Design tokens(`src/styles/globals.css`)
- 顏色全部定義成 CSS 自訂屬性(`--page`/`--surface`、`--ink-*`、`--grid`/`--baseline`/`--border`、`--series-1`/`--spark`/`--area-wash`、`--delta-up`/`--delta-down`),元件一律 `var(--token)`,**不寫死色碼**。
- 亮色是預設;深色經由兩個 scope 生效:`@media (prefers-color-scheme: dark)` 配 `:root:where(:not([data-theme="light"]))`,以及 `:root[data-theme="dark"]`(手動切換必須雙向都贏)。**深色的 token 值是依深色表面重新選的,不是亮色反轉**——改任何資料色前先跑色盲安全驗證器(dataviz skill 的 `validate_palette.js`),兩種表面各驗一次,不要目測。
- 共用樣式配方:`.card`、`.hairline-btn`、`.field`、`.seg`(segmented control)。

### 主題切換機制
- `layout.tsx` 的 `<body>` 開頭有一段 inline script,在 hydration 前從 localStorage(key: `fx-theme`)讀取並蓋 `data-theme`,避免閃爍——不要移到 useEffect。
- `ThemeToggle.tsx` 切換 + 記憶;`page.tsx` 把 theme 當 state 傳給 `TrendChart` 的 `key`,強制圖表以新 token 重繪。
- **canvas 讀不到 `var()`**:圖表顏色一律在渲染當下用 `src/lib/tokens.ts` 的 `cssToken()`(內部 getComputedStyle)解析成實際色值;SSR 期間回傳 fallback,不要直接在模組頂層呼叫。

### 資料視覺化規範(改圖表前先讀)
- **顏色跟實體走,不跟方向走**:走勢線/迷你線固定 `--series-1` 藍;漲跌方向由「帶 +/− 符號的 delta 文字」用 `--delta-up`/`--delta-down` 表達,顏色從不單獨承載意義。
- Sparkline 用低調色 `--spark` + 端點系列色圓點(帶表面色圓環),`events: []` 停用互動——它是 stat tile 的裝飾性趨勢,數值由走勢圖與表格提供。
- TrendChart 規格:2px 線、10% 面積淡染(`--area-wash`)、y 軸 hairline **實線**格線(不用虛線)、x 軸無格線、crosshair(自訂 plugin)+ index 模式 tooltip(值為主、日期為輔)、只在端點做直接標註。
- **表格檢視是無障礙等價物**,不是可選項——tooltip 只是增強,任何值都必須不靠 hover 也讀得到。改走勢圖時保留「圖表/表格」切換。
- 卡片(RateCard)遵循 stat tile 結構:label(貨幣對)/ value(匯率,proportional figures)/ delta(帶符號)/ trend(sparkline);`tabular-nums` 只用在表格對齊欄,不用在大數字上。

## 測試(`src/lib/*.test.ts`)

- `convert.test.ts`:換匯計算(cross rate、除零防呆、各幣別進位、浮點誤差情境)。
- `cache.test.ts`:TTL 命中/過期(注入假時鐘)、key 隔離。
- 跑單測不需網路;API route 沒有測試(外部依賴),核心邏輯都抽在 `lib/` 純函式層——新邏輯照這個模式放。
