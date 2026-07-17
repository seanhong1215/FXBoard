"use client";

import { useEffect, useState } from "react";
import { resolvedTheme } from "@/lib/tokens";

type ThemeToggleProps = {
  onChange?: (theme: "light" | "dark") => void;
};

/** 明暗主題切換:預設跟隨系統,點擊後記住選擇(localStorage)。 */
export default function ThemeToggle({ onChange }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = resolvedTheme();
    setTheme(t);
    onChange?.(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("fx-theme", next);
    } catch {
      /* private mode 等情況忽略 */
    }
    setTheme(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "切換為亮色主題" : "切換為深色主題"}
      title={theme === "dark" ? "切換為亮色主題" : "切換為深色主題"}
      className="hairline-btn grid h-9 w-9 place-items-center text-base"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
