import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimits } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(clearRateLimits);

  it("blocks requests after the configured maximum", () => {
    expect(checkRateLimit("ip", 2, 1_000, 0).allowed).toBe(true);
    expect(checkRateLimit("ip", 2, 1_000, 1).allowed).toBe(true);
    expect(checkRateLimit("ip", 2, 1_000, 2).allowed).toBe(false);
  });

  it("starts a new bucket after the window", () => {
    checkRateLimit("ip", 1, 1_000, 0);
    expect(checkRateLimit("ip", 1, 1_000, 1_001).allowed).toBe(true);
  });
});
