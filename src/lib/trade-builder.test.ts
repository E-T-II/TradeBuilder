import { describe, it, expect } from "vitest";
import {
  trendScore,
  locateOnCurve,
  curveScore,
  profitZoneRatio,
  profitZoneScore,
  totalScore,
  entryType,
  entryPrice,
  stopBuffer,
  stopLoss,
  tradeRiskPerShare,
  maxAccountRisk,
  positionSize,
  applyCapitalCap,
  targetPrice,
  rewardRiskRatio,
  buildTrade,
  type TradeInputs,
} from "./trade-builder";

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

describe("profitZoneRatio", () => {
  it("measures how many zone heights fit between entry and target", () => {
    // zone height 2 (108 - 106), distance 16 (124 - 108) -> 8x
    expect(profitZoneRatio(108, 106, 124)).toBe(8);
  });

  it("works the same for a short trade (target below entry)", () => {
    // zone height 2 (122 - 124), distance 16 (122 - 106) -> 8x
    expect(profitZoneRatio(122, 124, 106)).toBe(8);
  });

  it("returns 0 for a zero-height zone instead of dividing by zero", () => {
    expect(profitZoneRatio(108, 108, 124)).toBe(0);
  });
});

describe("profitZoneScore", () => {
  it("scores 2 points at 5:1 or better", () => {
    expect(profitZoneScore(5)).toBe(2);
    expect(profitZoneScore(8)).toBe(2);
  });

  it("scores 1 point at 3:1 or better", () => {
    expect(profitZoneScore(3)).toBe(1);
    expect(profitZoneScore(4.99)).toBe(1);
  });

  it("scores 0 below 3:1", () => {
    expect(profitZoneScore(2.99)).toBe(0);
    expect(profitZoneScore(0)).toBe(0);
  });
});

describe("totalScore", () => {
  it("adds all six odds enhancers", () => {
    expect(
      totalScore({
        curve: 1,
        trend: 2,
        profitZone: 2,
        strength: 2,
        time: 1,
        freshness: 2,
      }),
    ).toBe(10);
    expect(
      totalScore({
        curve: 1,
        trend: 2,
        profitZone: 2,
        strength: 1,
        time: 0.5,
        freshness: 1,
      }),
    ).toBe(7.5);
  });
});

describe("entryType", () => {
  it("calls for a proximal entry from 8.5 up", () => {
    expect(entryType(8.5)).toBe("proximal");
    expect(entryType(10)).toBe("proximal");
  });

  it("calls for a confirmation entry from 7 up to 8.5", () => {
    expect(entryType(7)).toBe("confirmation");
    expect(entryType(8)).toBe("confirmation");
    // 8.4 can't come off a real scorecard (0.5 steps), but the function
    // still maps anything in this range to confirmation
    expect(entryType(8.4)).toBe("confirmation");
  });

  it("calls no trade below 7", () => {
    expect(entryType(6.9)).toBe("no-trade");
    expect(entryType(0)).toBe("no-trade");
  });
});

describe("entryPrice", () => {
  it("places a proximal entry right at the proximal line", () => {
    expect(entryPrice(108, "proximal", "long")).toBe(108);
    expect(entryPrice(122, "proximal", "short")).toBe(122);
  });

  it("places a confirmation entry 10 cents past the proximal line", () => {
    expect(entryPrice(108, "confirmation", "long")).toBe(108.1);
    expect(entryPrice(122, "confirmation", "short")).toBe(121.9);
  });

  it("returns null when there is no trade", () => {
    expect(entryPrice(108, "no-trade", "long")).toBeNull();
  });
});

describe("stopBuffer", () => {
  it("matches the README's NVDA example: 5.93 ATR daily -> 12 cents", () => {
    // 5.93 x 0.02 = 0.1186, always rounded up -> 0.12
    expect(stopBuffer(5.93, "daily")).toBe(0.12);
  });

  it("uses 10% of ATR for weekly income or greater", () => {
    expect(stopBuffer(5.93, "weekly")).toBe(0.6); // 0.593 rounded up
  });

  it("does not bump an amount already on the cent", () => {
    expect(stopBuffer(5, "daily")).toBe(0.1); // exactly 0.10
  });
});

describe("stopLoss", () => {
  it("goes below a demand zone distal for a long", () => {
    expect(stopLoss(106, 0.12, "long")).toBe(105.88);
  });

  it("goes above a supply zone distal for a short", () => {
    expect(stopLoss(124, 0.12, "short")).toBe(124.12);
  });
});

describe("tradeRiskPerShare", () => {
  it("is the distance between entry and stop", () => {
    expect(tradeRiskPerShare(24.66, 24.45)).toBe(0.21);
    expect(tradeRiskPerShare(121.9, 124.08)).toBe(2.18);
  });
});

describe("position sizing (README examples)", () => {
  it("max account risk: $600 x 2% = $12", () => {
    expect(maxAccountRisk(600, 0.02)).toBe(12);
  });

  it("position size: $12 risk / $0.50 per share = 24 shares", () => {
    expect(positionSize(12, 0.5)).toBe(24);
  });

  it("returns 0 shares when risk per share is zero", () => {
    expect(positionSize(12, 0)).toBe(0);
  });

  it("Scenario 1, Ford at $13.34: 24 shares adjusts down to 22", () => {
    // capital 24 x 13.34 = 320.16, over 50% of $600
    expect(applyCapitalCap(24, 13.34, 600)).toBe(22);
    expect(22 * 13.34).toBeCloseTo(293.48, 2);
  });

  it("Scenario 2, Ford at $70: 24 shares adjusts down to 4", () => {
    // capital 1680, way over $300
    expect(applyCapitalCap(24, 70, 600)).toBe(4);
    expect(4 * 70).toBe(280);
  });

  it("Scenario 3, Lucid at $24.66 entry, $24.45 stop: 57 shares adjusts to 12", () => {
    const risk = tradeRiskPerShare(24.66, 24.45);
    expect(risk).toBe(0.21);
    const size = positionSize(maxAccountRisk(600, 0.02), risk);
    expect(size).toBe(57);
    const adjusted = applyCapitalCap(size, 24.66, 600);
    expect(adjusted).toBe(12);
    expect(12 * 24.66).toBeCloseTo(295.92, 2);
    expect(12 * 0.21).toBeCloseTo(2.52, 2);
  });

  it("leaves the position alone when capital is within 50% of balance", () => {
    expect(applyCapitalCap(10, 20, 600)).toBe(10); // $200 < $300
  });
});

describe("targetPrice", () => {
  it("takes 75% of the profit zone above the entry proximal for a long", () => {
    expect(targetPrice(108, 124, 0.75, "long")).toBe(120);
  });

  it("takes it below the entry proximal for a short", () => {
    expect(targetPrice(122, 106, 0.75, "short")).toBe(110);
  });

  it("supports the 80% end of the buffer range", () => {
    expect(targetPrice(108, 124, 0.8, "long")).toBe(120.8);
  });
});

describe("rewardRiskRatio", () => {
  it("divides the entry-to-target distance by the risk", () => {
    expect(rewardRiskRatio(108, 106, 120)).toBe(6);
  });

  it("returns 0 when there is no risk distance", () => {
    expect(rewardRiskRatio(108, 108, 120)).toBe(0);
  });
});

// End-to-end tests

const longTrade: TradeInputs = {
  accountBalance: 2500,
  riskTolerancePct: 0.02,
  targetBufferPct: 0.75,
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: 4,
  curveLow: 100,
  curveHigh: 130,
  entryProximal: 108,
  entryDistal: 106,
  targetProximal: 124,
  targetDistal: 126,
  strength: 1,
  time: 0.5,
  freshness: 1,
};

describe("buildTrade, long confirmation entry with the 50% cap", () => {
  const result = buildTrade(longTrade);

  it("scores the trade 7.5 and calls a confirmation entry", () => {
    expect(result.scorecard.curveZone).toBe("wholesale");
    expect(result.scorecard.curve).toBe(1);
    expect(result.scorecard.trend).toBe(2);
    expect(result.scorecard.profitZone).toBe(2);
    expect(result.scorecard.total).toBe(7.5);
    expect(result.entryType).toBe("confirmation");
  });

  it("prices the order off the proximal line plus 10 cents", () => {
    expect(result.order?.entry).toBe(108.1);
    expect(result.order?.stop).toBe(105.92); // 106 - (4 x 0.02)
    expect(result.order?.target).toBe(120);
    expect(result.order?.riskPerShare).toBe(2.18);
  });

  it("caps the position at 50% of the balance", () => {
    // uncapped would be 22 shares (~$2378); cap is $1250
    expect(result.order?.positionSize).toBe(11);
    expect(result.order?.capitalRequirement).toBe(1189.1);
    expect(result.order?.totalTradeRisk).toBe(23.98);
  });

  it("passes every risk check", () => {
    expect(result.checks?.withinPerTradeRisk).toBe(true);
    expect(result.checks?.withinCapitalCap).toBe(true);
    expect(result.checks?.meetsRewardRisk).toBe(true);
    expect(result.checks?.withinMultiTradeRisk).toBe(true);
  });
});

describe("buildTrade, the same setup in a sideways trend", () => {
  const result = buildTrade({ ...longTrade, trend: "sideways" });

  it("drops to 6.5 and refuses the trade", () => {
    expect(result.scorecard.total).toBe(6.5);
    expect(result.entryType).toBe("no-trade");
    expect(result.order).toBeNull();
    expect(result.checks).toBeNull();
  });
});

describe("buildTrade, short trade, everything mirrored", () => {
  const result = buildTrade({
    ...longTrade,
    direction: "short",
    trend: "downtrend",
    entryProximal: 122,
    entryDistal: 124,
    targetProximal: 106,
    targetDistal: 104,
  });

  it("scores off the top of the curve", () => {
    expect(result.scorecard.curveZone).toBe("retail");
    expect(result.scorecard.curve).toBe(1);
    expect(result.scorecard.trend).toBe(2);
    expect(result.scorecard.profitZone).toBe(2);
    expect(result.scorecard.total).toBe(7.5);
  });

  it("places the confirmation entry 10 cents below the proximal", () => {
    expect(result.order?.entry).toBe(121.9);
    expect(result.order?.stop).toBe(124.08); // 124 + buffer, above the zone
    expect(result.order?.target).toBe(110); // 122 - 12
  });

  it("sizes and caps the position the same way", () => {
    expect(result.order?.riskPerShare).toBe(2.18);
    expect(result.order?.positionSize).toBe(10); // floor(1250 / 121.90)
  });
});

describe("buildTrade, the 6% multiple-trade rule", () => {
  it("flags a new trade that would push open risk past 6%", () => {
    // $600 account -> $36 limit. This trade risks ~$11 on its own.
    const base: TradeInputs = {
      ...longTrade,
      accountBalance: 600,
      atr: 1,
      entryProximal: 13.24,
      entryDistal: 13,
      targetProximal: 15,
      targetDistal: 15.5,
      curveLow: 12,
      curveHigh: 18,
    };
    const fine = buildTrade({ ...base, openTradeRisk: 20 });
    const over = buildTrade({ ...base, openTradeRisk: 30 });
    expect(fine.checks?.withinMultiTradeRisk).toBe(true);
    expect(over.checks?.withinMultiTradeRisk).toBe(false);
    expect(over.checks?.multiTradeLimit).toBe(36);
  });
});
