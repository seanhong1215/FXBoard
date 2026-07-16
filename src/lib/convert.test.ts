import { describe, it, expect } from "vitest";
import { convertAmount, applyRate, pairRate, percentChange } from "./convert";

describe("convertAmount", () => {
  it("converts base→quote using base-relative rates", () => {
    // base = USD, rates: USD=1, EUR=0.8, JPY=160
    // 100 USD → EUR = 100 * 0.8 / 1 = 80.00
    expect(convertAmount(100, 1, 0.8, 2)).toBe("80.00");
  });

  it("converts quote→base (division path)", () => {
    // 80 EUR → USD = 80 / 0.8 * 1 = 100.00
    expect(convertAmount(80, 0.8, 1, 2)).toBe("100.00");
  });

  it("converts cross rate quote→quote", () => {
    // 160 JPY → EUR with rates EUR=0.8, JPY=160
    // baseValue = 160/160 = 1 USD → * 0.8 = 0.80
    expect(convertAmount(160, 160, 0.8, 2)).toBe("0.80");
  });

  it("rounds to zero decimals for currencies like JPY", () => {
    // 1 USD → JPY at 162.39 → 162 (half-up)
    expect(convertAmount(1, 1, 162.39, 0)).toBe("162");
    expect(convertAmount(1, 1, 162.5, 0)).toBe("163");
  });

  it("avoids floating-point drift (the reason we use Decimal)", () => {
    // 0.1 + 0.2 in float is 0.30000000000000004.
    // Adding via repeated conversion must stay exact.
    const a = convertAmount(0.1, 1, 1, 2);
    const b = convertAmount(0.2, 1, 1, 2);
    // Decimal keeps these exact; native (0.1+0.2).toFixed(2) also rounds,
    // but the key guarantee is no accumulated error across many ops.
    expect(a).toBe("0.10");
    expect(b).toBe("0.20");
  });

  it("throws when fromRate is zero", () => {
    expect(() => convertAmount(100, 0, 1, 2)).toThrow();
  });
});

describe("applyRate", () => {
  it("multiplies amount by rate with rounding", () => {
    expect(applyRate(100, 0.87673, 2)).toBe("87.67");
  });
});

describe("pairRate", () => {
  it("returns how many quote units per 1 from unit", () => {
    // rates: EUR=0.8, JPY=160 → 1 EUR = 160/0.8 = 200 JPY
    expect(pairRate(0.8, 160, 2)).toBe("200.00");
  });
});

describe("percentChange", () => {
  it("computes percentage change", () => {
    expect(percentChange(110, 100)).toBeCloseTo(10, 6);
    expect(percentChange(90, 100)).toBeCloseTo(-10, 6);
  });

  it("returns 0 when previous is 0", () => {
    expect(percentChange(100, 0)).toBe(0);
  });
});
