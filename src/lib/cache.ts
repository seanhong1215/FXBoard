// 通用 TTL 記憶體快取 / Generic in-memory TTL cache
//
// 外部匯率 API 具有速率限制，且參考匯率更新頻率較低。
// TTL cache 可降低重複請求、縮短回應時間並減少觸發來源端限制的風險。
// 快取未命中或過期時才會向外部來源取得資料。
//
// 設計成可測試：時間來源以 `nowFn` 注入，測試可用假時鐘驗證過期行為。

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

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
  inFlight.clear();
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

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) {
    return { value: await pending, hit: true };
  }

  const request = loader();
  inFlight.set(key, request);
  try {
    const value = await request;
    store.set(key, { value, expiresAt: nowFn() + ttlMs });
    return { value, hit: false };
  } finally {
    inFlight.delete(key);
  }
}
