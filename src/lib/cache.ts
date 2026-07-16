// 通用 TTL 記憶體快取 / Generic in-memory TTL cache
//
// 為什麼需要這一層：外部匯率 API 有速率限制，且匯率變動頻率不高。
// 若前端每次載入都直接打外部 API，會浪費請求、拖慢載入、甚至被限流。
// 這一層讓「命中即回」成為常態，只有快取過期時才真的向外部取數。
//
// 設計成可測試：時間來源以 `nowFn` 注入，測試可用假時鐘驗證過期行為。

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

let nowFn: () => number = () => Date.now();

/** 測試用：注入假時鐘。 */
export function __setNow(fn: () => number) {
  nowFn = fn;
}

/** 測試用：還原真實時鐘。 */
export function __resetNow() {
  nowFn = () => Date.now();
}

/** 清空整個快取（測試或手動失效用）。 */
export function clearCache() {
  store.clear();
}

export type CacheResult<T> = {
  value: T;
  /** true = 命中快取；false = 未命中，實際呼叫了 loader */
  hit: boolean;
};

/**
 * 以 key 取值：命中且未過期則直接回傳；否則呼叫 loader 取新值並寫回快取。
 *
 * @param key    快取鍵（建議包含 base/symbols 等查詢參數）
 * @param ttlMs  存活時間（毫秒）
 * @param loader 未命中時的取數函式
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<CacheResult<T>> {
  const now = nowFn();
  const existing = store.get(key) as Entry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return { value: existing.value, hit: true };
  }

  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlMs });
  return { value, hit: false };
}
