import { describe, it, expect, beforeEach, vi } from "vitest";
import { cached, clearCache, __setNow, __resetNow } from "./cache";

describe("cached (TTL in-memory cache)", () => {
  beforeEach(() => {
    clearCache();
    __resetNow();
  });

  it("calls loader on miss and returns hit=false", async () => {
    const loader = vi.fn(async () => 42);
    const r = await cached("k", 1000, loader);
    expect(r.value).toBe(42);
    expect(r.hit).toBe(false);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("returns cached value without calling loader again within TTL", async () => {
    const loader = vi.fn(async () => 42);
    await cached("k", 1000, loader);
    const second = await cached("k", 1000, loader);
    expect(second.value).toBe(42);
    expect(second.hit).toBe(true);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("re-calls loader after TTL expires", async () => {
    let now = 0;
    __setNow(() => now);
    const loader = vi.fn(async () => Math.random());

    await cached("k", 1000, loader); // miss at t=0
    now = 500;
    const hit = await cached("k", 1000, loader); // still valid
    expect(hit.hit).toBe(true);

    now = 1500; // expired
    const miss = await cached("k", 1000, loader);
    expect(miss.hit).toBe(false);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("keys are independent", async () => {
    const loader = vi.fn(async (v: number) => v);
    await cached("a", 1000, () => loader(1));
    await cached("b", 1000, () => loader(2));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
