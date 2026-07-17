// Canvas 圖表無法直接讀 CSS 變數 — 渲染當下以 getComputedStyle 解析。
// SSR 期間回傳 fallback(圖表本來就只在客戶端繪製)。

export function cssToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

/** 目前生效的主題(考慮 data-theme 覆寫與 OS 偏好)。 */
export function resolvedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stamped = document.documentElement.dataset.theme;
  if (stamped === "light" || stamped === "dark") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
