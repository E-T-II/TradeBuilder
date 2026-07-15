import { describe, it, expect } from "vitest";
import { trendScore, locateOnCurve, curveScore } from "./trade-builder";

describe("trendScore", () => {
  it("rewards a long trade for going with the trend", () => {
    expect(trendScore("uptrend", "long")).toBe(2);
    expect(trendScore("sideways", "long")).toBe(1);
    expect(trendScore("downtrend", "long")).toBe(0);
  });

  it("mirrors the scoring for a short trade", () => {
    expect(trendScore("downtrend", "short")).toBe(2);
    expect(trendScore("sideways", "short")).toBe(1);
    expect(trendScore("uptrend", "short")).toBe(0);
  });
});

describe("locateOnCurve", () => {
  // range 100 -> 130, so thirds are: wholesale 100-110, equilibrium 110-120, retail 120-130
  it("puts a cheap price in wholesale", () => {
    expect(locateOnCurve(105, 100, 130)).toBe("wholesale");
    expect(locateOnCurve(108, 100, 130)).toBe("wholesale");
  });

  it("puts a mid price in equilibrium", () => {
    expect(locateOnCurve(115, 100, 130)).toBe("equilibrium");
  });

  it("puts an expensive price in retail", () => {
    expect(locateOnCurve(125, 100, 130)).toBe("retail");
  });

  it("counts a price on a boundary line as the higher zone", () => {
    expect(locateOnCurve(110, 100, 130)).toBe("equilibrium");
    expect(locateOnCurve(120, 100, 130)).toBe("retail");
  });
});

describe("curveScore", () => {
  it("rewards buying long down in wholesale", () => {
    expect(curveScore("wholesale", "long")).toBe(1);
    expect(curveScore("equilibrium", "long")).toBe(0.5);
    expect(curveScore("retail", "long")).toBe(0);
  });

  it("mirrors the scoring for a short trade", () => {
    expect(curveScore("retail", "short")).toBe(1);
    expect(curveScore("equilibrium", "short")).toBe(0.5);
    expect(curveScore("wholesale", "short")).toBe(0);
  });
});
