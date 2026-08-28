# Vercel 免費部署指南

FXBoard 採用 Next.js App Router 與 Route Handlers，正式展示站部署到 Vercel Hobby；GitHub repository 用來公開原始碼、測試與 CI。這個方案不需要資料庫、Redis、付費網域或付費 API。

## 免費服務組合

- GitHub Free：公開 repository 與 GitHub Actions CI。
- Vercel Hobby：Next.js 網站、Serverless Route Handlers、自動 HTTPS 與 Git 部署。
- Frankfurter API：匯率資料，免費且免 API key。
- Vercel 提供的 `*.vercel.app` 網址：免費，不購買自訂網域。

本部署方案不包含付費 Vercel plan、外部 Redis/KV、信用卡自動加值或其他付費資源。免費額度耗盡時，服務將維持暫停狀態。

## 部署步驟

1. 將清理完成的程式 push 到 GitHub `main`。
2. 使用 GitHub 帳號登入 Vercel，選擇 **Add New → Project**。
3. Import 此 repository；Framework Preset 保持 **Next.js**。
4. Build Command 使用 `npm run build`，其餘維持 Vercel 自動偵測。
5. 在 Project Settings → Environment Variables 加入下表設定。
6. 選擇 Production、Preview、Development 三種環境後部署。
7. 部署完成後測試首頁、`/api/rates?base=USD` 與 `/api/history?base=USD&days=8`。

`output: "export"` 與 `basePath` 適用於靜態 GitHub Pages，不適用於本專案的動態 Route Handlers。

## Vercel 環境變數

所有設定均由伺服器端使用，不含 `NEXT_PUBLIC_` 前綴。

| Name | 建議值 | 必填 | 用途 |
|---|---:|---:|---|
| `FX_API_BASE` | `https://api.frankfurter.dev/v1` | 否 | 匯率 API；程式已有相同預設值 |
| `FX_API_TIMEOUT_MS` | `8000` | 否 | 外部請求 timeout |
| `FX_RATES_TTL_MS` | `60000` | 否 | 最新匯率記憶體/CDN cache TTL |
| `FX_HISTORY_TTL_MS` | `3600000` | 否 | 歷史資料記憶體/CDN cache TTL |
| `FX_RATE_LIMIT_MAX` | `60` | 否 | 每個時間窗允許的單實例請求數 |
| `FX_RATE_LIMIT_WINDOW_MS` | `60000` | 否 | 限流時間窗 |

Frankfurter 不需要 API key；本專案未使用 `TWELVE_DATA_API_KEY`。

即使完全不設定環境變數，程式也會使用上表預設值正常啟動；在 Vercel 明確設定的好處是未來可直接由後台調整，不必改程式碼。

## 免費架構的限制

- 記憶體 TTL cache 與 rate limiter 僅存在單一 warm Serverless instance，不跨 instance 共享，冷啟動或重新部署後會清空。
- CDN 的 `s-maxage` 會減少實際進入 Function 的相同 GET 請求，但不能當作資料庫或永久快取。
- Frankfurter/ECB 是每日參考匯率，不是可交易的即時市場報價。
- Vercel Hobby 適用於非商業技術展示；商業服務需另行評估方案與 SLA。

此配置適用於低流量公開展示，且不引入付費基礎設施。

## 上線後檢查

```text
GET /
GET /api/rates?base=USD
GET /api/history?base=USD&days=8
GET /api/rates?base=TWD        → 400
GET /api/history?days=999      → 400
```

另外確認明暗主題、基準幣別切換、換匯試算、手機版以及 API 失敗提示。
