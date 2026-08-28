import { describe, expect, it } from "vitest";
import { parseFxQuery, parseHistoryDays } from "./api-query";

describe("parseFxQuery", () => {
  it("uses supported defaults", () => {
    const result = parseFxQuery(new URLSearchParams());
    expect(result.base).toBe("USD");
    expect(result.symbols).not.toContain("USD");
    expect(result.symbols.length).toBeGreaterThan(0);
  });

  it("normalizes and de-duplicates symbols", () => {
    const result = parseFxQuery(
      new URLSearchParams("base=eur&symbols=usd,jpy,USD,eur")
    );
    expect(result).toEqual({ base: "EUR", symbols: ["USD", "JPY"] });
  });

  it("rejects unsupported currencies", () => {
    expect(() =>
      parseFxQuery(new URLSearchParams("base=TWD"))
    ).toThrow("Unsupported base currency");
    expect(() =>
      parseFxQuery(new URLSearchParams("symbols=EUR,TWD"))
    ).toThrow("Unsupported quote currency");
  });
});

describe("parseHistoryDays", () => {
  it("uses 8 days by default", () => {
    expect(parseHistoryDays(new URLSearchParams())).toBe(8);
  });

  it("accepts the valid range and rejects invalid values", () => {
    expect(parseHistoryDays(new URLSearchParams("days=30"))).toBe(30);
    expect(() => parseHistoryDays(new URLSearchParams("days=1"))).toThrow();
    expect(() => parseHistoryDays(new URLSearchParams("days=3.5"))).toThrow();
  });
});
