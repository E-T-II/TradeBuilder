import { describe, expect, test } from "vitest";
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
  decisionMatrix,
  type TradeInputs,
} from "./trade-builder";

describe("given trendScore", () => {
  test("given a long trade: should score 2 with the trend, 1 sideways, 0 against", () => {
    expect(trendScore("uptrend", "long")).toBe(2);
    expect(trendScore("sideways", "long")).toBe(1);
    expect(trendScore("downtrend", "long")).toBe(0);
  });

  test("given a short trade: should mirror the scoring", () => {
    expect(trendScore("downtrend", "short")).toBe(2);
    expect(trendScore("sideways", "short")).toBe(1);
    expect(trendScore("uptrend", "short")).toBe(0);
  });
});

describe("given locateOnCurve", () => {
  // range 100 -> 130, so thirds are: wholesale 100-110, equilibrium 110-120, retail 120-130
  test("given a cheap price: should place it in wholesale", () => {
    expect(locateOnCurve(105, 100, 130)).toBe("wholesale");
    expect(locateOnCurve(108, 100, 130)).toBe("wholesale");
  });

  test("given a mid price: should place it in equilibrium", () => {
    expect(locateOnCurve(115, 100, 130)).toBe("equilibrium");
  });

  test("given an expensive price: should place it in retail", () => {
    expect(locateOnCurve(125, 100, 130)).toBe("retail");
  });

  test("given a price on a boundary line: should count it as the higher zone", () => {
    expect(locateOnCurve(110, 100, 130)).toBe("equilibrium");
    expect(locateOnCurve(120, 100, 130)).toBe("retail");
  });
});

describe("given curveScore", () => {
  test("given a long: should score 1 wholesale, 0.5 equilibrium, 0 retail", () => {
    expect(curveScore("wholesale", "long")).toBe(1);
    expect(curveScore("equilibrium", "long")).toBe(0.5);
    expect(curveScore("retail", "long")).toBe(0);
  });

  test("given a short trade: should mirror the scoring", () => {
    expect(curveScore("retail", "short")).toBe(1);
    expect(curveScore("equilibrium", "short")).toBe(0.5);
    expect(curveScore("wholesale", "short")).toBe(0);
  });
});

describe("given profitZoneRatio", () => {
  test("given entry and target prices: should count how many zone heights fit between them", () => {
    // zone height 2 (108 - 106), distance 16 (124 - 108) -> 8x
    expect(profitZoneRatio(108, 106, 124)).toBe(8);
  });

  test("given a short with the target below entry: should measure the same way", () => {
    // zone height 2 (122 - 124), distance 16 (122 - 106) -> 8x
    expect(profitZoneRatio(122, 124, 106)).toBe(8);
  });

  test("given a zero-height zone: should return 0 instead of dividing by zero", () => {
    expect(profitZoneRatio(108, 108, 124)).toBe(0);
  });
});

describe("given profitZoneScore", () => {
  test("given a ratio of 5:1 or better: should score 2", () => {
    expect(profitZoneScore(5)).toBe(2);
    expect(profitZoneScore(8)).toBe(2);
  });

  test("given a ratio of 3:1 or better: should score 1", () => {
    expect(profitZoneScore(3)).toBe(1);
    expect(profitZoneScore(4.99)).toBe(1);
  });

  test("given a ratio below 3:1: should score 0", () => {
    expect(profitZoneScore(2.99)).toBe(0);
    expect(profitZoneScore(0)).toBe(0);
  });
});

describe("given totalScore", () => {
  test("given the six odds enhancers: should add them up", () => {
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

describe("given decisionMatrix", () => {
  // Every cell of the README Decision Matrix (rows a-r). The profit ratio only
  // changes the outcome in the "needs-5to1" cells (c, f, m, p), so those appear
  // twice: once clearing 5:1 and once below it.
  const rows = [
    // supply zone -> short
    { row: "a", zone: "supply", curve: "retail", trend: "downtrend", ratio: 3, want: "short" },
    { row: "b", zone: "supply", curve: "retail", trend: "sideways", ratio: 3, want: "short" },
    { row: "c", zone: "supply", curve: "retail", trend: "uptrend", ratio: 5, want: "short" },
    { row: "c<", zone: "supply", curve: "retail", trend: "uptrend", ratio: 4, want: "no-trade" },
    { row: "g", zone: "supply", curve: "equilibrium", trend: "downtrend", ratio: 3, want: "short" },
    { row: "h", zone: "supply", curve: "equilibrium", trend: "sideways", ratio: 3, want: "short" },
    { row: "i", zone: "supply", curve: "equilibrium", trend: "uptrend", ratio: 8, want: "no-trade" },
    { row: "m", zone: "supply", curve: "wholesale", trend: "downtrend", ratio: 5, want: "short" },
    { row: "m<", zone: "supply", curve: "wholesale", trend: "downtrend", ratio: 4, want: "no-trade" },
    { row: "n", zone: "supply", curve: "wholesale", trend: "sideways", ratio: 8, want: "no-trade" },
    { row: "o", zone: "supply", curve: "wholesale", trend: "uptrend", ratio: 8, want: "no-trade" },
    // demand zone -> long
    { row: "d", zone: "demand", curve: "retail", trend: "downtrend", ratio: 8, want: "no-trade" },
    { row: "e", zone: "demand", curve: "retail", trend: "sideways", ratio: 8, want: "no-trade" },
    { row: "f", zone: "demand", curve: "retail", trend: "uptrend", ratio: 5, want: "long" },
    { row: "f<", zone: "demand", curve: "retail", trend: "uptrend", ratio: 4, want: "no-trade" },
    { row: "j", zone: "demand", curve: "equilibrium", trend: "downtrend", ratio: 8, want: "no-trade" },
    { row: "k", zone: "demand", curve: "equilibrium", trend: "sideways", ratio: 3, want: "long" },
    { row: "l", zone: "demand", curve: "equilibrium", trend: "uptrend", ratio: 3, want: "long" },
    { row: "p", zone: "demand", curve: "wholesale", trend: "downtrend", ratio: 5, want: "long" },
    { row: "p<", zone: "demand", curve: "wholesale", trend: "downtrend", ratio: 4, want: "no-trade" },
    { row: "q", zone: "demand", curve: "wholesale", trend: "sideways", ratio: 3, want: "long" },
    { row: "r", zone: "demand", curve: "wholesale", trend: "uptrend", ratio: 3, want: "long" },
  ] as const;

  test.each(rows)(
    "given row $row ($zone $curve, $trend, ratio $ratio): should resolve to $want",
    ({ zone, curve, trend, ratio, want }) => {
      expect(decisionMatrix(zone, curve, trend, ratio)).toBe(want);
    },
  );

  test("given a needs-5to1 cell exactly at 5:1: should take the trade", () => {
    expect(decisionMatrix("demand", "retail", "uptrend", 5)).toBe("long");
  });
});

describe("given entryType", () => {
  test("given a score of 8.5 or more: should call a proximal entry", () => {
    expect(entryType(8.5)).toBe("proximal");
    expect(entryType(10)).toBe("proximal");
  });

  test("given a score from 7 up to 8.5: should call a confirmation entry", () => {
    expect(entryType(7)).toBe("confirmation");
    expect(entryType(8)).toBe("confirmation");
    // 8.4 can't come off a real scorecard (0.5 steps), but the function
    // still maps anything in this range to confirmation
    expect(entryType(8.4)).toBe("confirmation");
  });

  test("given a score below 7: should call no trade", () => {
    expect(entryType(6.9)).toBe("no-trade");
    expect(entryType(0)).toBe("no-trade");
  });
});

describe("given entryPrice", () => {
  test("given a proximal entry: should place it right at the proximal line", () => {
    expect(entryPrice(108, "proximal", "long")).toBe(108);
    expect(entryPrice(122, "proximal", "short")).toBe(122);
  });

  test("given a confirmation entry: should place it 10 cents past the proximal line", () => {
    expect(entryPrice(108, "confirmation", "long")).toBe(108.1);
    expect(entryPrice(122, "confirmation", "short")).toBe(121.9);
  });

  test("given no trade: should return null", () => {
    expect(entryPrice(108, "no-trade", "long")).toBeNull();
  });
});

describe("given stopBuffer", () => {
  test("given the NVDA daily example (5.93 ATR): should round up to a 12 cent buffer", () => {
    // 5.93 x 0.02 = 0.1186, always rounded up -> 0.12
    expect(stopBuffer(5.93, "daily")).toBe(0.12);
  });

  test("given a weekly objective: should use 10% of ATR", () => {
    expect(stopBuffer(5.93, "weekly")).toBe(0.6); // 0.593 rounded up
  });

  test("given an amount already on the cent: should not bump it", () => {
    expect(stopBuffer(5, "daily")).toBe(0.1); // exactly 0.10
  });
});

describe("given stopLoss", () => {
  test("given a long: should sit below the demand zone distal", () => {
    expect(stopLoss(106, 0.12, "long")).toBe(105.88);
  });

  test("given a short: should sit above the supply zone distal", () => {
    expect(stopLoss(124, 0.12, "short")).toBe(124.12);
  });
});

describe("given tradeRiskPerShare", () => {
  test("given an entry and stop: should return the distance between them", () => {
    expect(tradeRiskPerShare(24.66, 24.45)).toBe(0.21);
    expect(tradeRiskPerShare(121.9, 124.08)).toBe(2.18);
  });
});

describe("given position sizing (README examples)", () => {
  test("given a $600 balance at 2%: should give $12 max account risk", () => {
    expect(maxAccountRisk(600, 0.02)).toBe(12);
  });

  test("given $12 risk over $0.50 per share: should size 24 shares", () => {
    expect(positionSize(12, 0.5)).toBe(24);
  });

  test("given zero risk per share: should size 0 shares", () => {
    expect(positionSize(12, 0)).toBe(0);
  });

  test("given Ford at $13.34 (Scenario 1): should adjust 24 shares down to 22", () => {
    // capital 24 x 13.34 = 320.16, over 50% of $600
    expect(applyCapitalCap(24, 13.34, 600)).toBe(22);
    expect(22 * 13.34).toBeCloseTo(293.48, 2);
  });

  test("given Ford at $70 (Scenario 2): should adjust 24 shares down to 4", () => {
    // capital 1680, way over $300
    expect(applyCapitalCap(24, 70, 600)).toBe(4);
    expect(4 * 70).toBe(280);
  });

  test("given Lucid at $24.66 (Scenario 3): should adjust 57 shares down to 12", () => {
    const risk = tradeRiskPerShare(24.66, 24.45);
    expect(risk).toBe(0.21);
    const size = positionSize(maxAccountRisk(600, 0.02), risk);
    expect(size).toBe(57);
    const adjusted = applyCapitalCap(size, 24.66, 600);
    expect(adjusted).toBe(12);
    expect(12 * 24.66).toBeCloseTo(295.92, 2);
    expect(12 * 0.21).toBeCloseTo(2.52, 2);
  });

  test("given capital within 50% of balance: should leave the position alone", () => {
    expect(applyCapitalCap(10, 20, 600)).toBe(10); // $200 < $300
  });
});

describe("given targetPrice", () => {
  test("given a long at a 75% buffer: should sit above the entry proximal", () => {
    expect(targetPrice(108, 124, 0.75, "long")).toBe(120);
  });

  test("given a short: should sit below the entry proximal", () => {
    expect(targetPrice(122, 106, 0.75, "short")).toBe(110);
  });

  test("given an 80% buffer: should extend further", () => {
    expect(targetPrice(108, 124, 0.8, "long")).toBe(120.8);
  });
});

describe("given rewardRiskRatio", () => {
  test("given entry, stop and target: should divide the entry-to-target distance by the risk", () => {
    expect(rewardRiskRatio(108, 106, 120)).toBe(6);
  });

  test("given no risk distance: should return 0", () => {
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

describe("given buildTrade for a long confirmation entry with the 50% cap", () => {
  const result = buildTrade(longTrade);

  test("given the setup: should score 7.5 and call a confirmation entry", () => {
    expect(result.scorecard.curveZone).toBe("wholesale");
    expect(result.scorecard.curve).toBe(1);
    expect(result.scorecard.trend).toBe(2);
    expect(result.scorecard.profitZone).toBe(2);
    expect(result.scorecard.total).toBe(7.5);
    expect(result.entryType).toBe("confirmation");
  });

  test("given the setup: should price the order off the proximal line plus 10 cents", () => {
    expect(result.order?.entry).toBe(108.1);
    expect(result.order?.stop).toBe(105.92); // 106 - (4 x 0.02)
    expect(result.order?.target).toBe(120);
    expect(result.order?.riskPerShare).toBe(2.18);
  });

  test("given the setup: should cap the position at 50% of the balance", () => {
    // uncapped would be 22 shares (~$2378); cap is $1250
    expect(result.order?.positionSize).toBe(11);
    expect(result.order?.capitalRequirement).toBe(1189.1);
    expect(result.order?.totalTradeRisk).toBe(23.98);
  });

  test("given the setup: should pass every risk check", () => {
    expect(result.checks?.withinPerTradeRisk).toBe(true);
    expect(result.checks?.withinCapitalCap).toBe(true);
    expect(result.checks?.meetsRewardRisk).toBe(true);
    expect(result.checks?.withinMultiTradeRisk).toBe(true);
  });
});

describe("given buildTrade for the same setup in a sideways trend", () => {
  const result = buildTrade({ ...longTrade, trend: "sideways" });

  test("given a sideways trend: should drop to 6.5 and refuse the trade", () => {
    expect(result.scorecard.total).toBe(6.5);
    expect(result.entryType).toBe("no-trade");
    expect(result.order).toBeNull();
    expect(result.checks).toBeNull();
  });
});

describe("given buildTrade for a mirrored short trade", () => {
  const result = buildTrade({
    ...longTrade,
    direction: "short",
    trend: "downtrend",
    entryProximal: 122,
    entryDistal: 124,
    targetProximal: 106,
    targetDistal: 104,
  });

  test("given a short: should score off the top of the curve", () => {
    expect(result.scorecard.curveZone).toBe("retail");
    expect(result.scorecard.curve).toBe(1);
    expect(result.scorecard.trend).toBe(2);
    expect(result.scorecard.profitZone).toBe(2);
    expect(result.scorecard.total).toBe(7.5);
  });

  test("given a short: should place the confirmation entry 10 cents below the proximal", () => {
    expect(result.order?.entry).toBe(121.9);
    expect(result.order?.stop).toBe(124.08); // 124 + buffer, above the zone
    expect(result.order?.target).toBe(110); // 122 - 12
  });

  test("given a short: should size and cap the position the same way", () => {
    expect(result.order?.riskPerShare).toBe(2.18);
    expect(result.order?.positionSize).toBe(10); // floor(1250 / 121.90)
  });
});

describe("given buildTrade with a zone gap tighter than the confirmation offset", () => {
  // Same zones throughout; only the judged score changes the entry type, which
  // is what flips a valid proximal trade into an impossible confirmation one.
  const tight: TradeInputs = {
    accountBalance: 5000,
    riskTolerancePct: 0.02,
    targetBufferPct: 0.75,
    direction: "long",
    trend: "uptrend",
    timeframe: "daily",
    atr: 0.5,
    curveLow: 100,
    curveHigh: 130,
    entryProximal: 100,
    entryDistal: 99.99,
    targetProximal: 100.1,
    targetDistal: 101,
    strength: 1,
    time: 0.5,
    freshness: 0.5, // judged 2 -> total 7, a confirmation entry
  };

  test("given a confirmation entry whose buffered target lands past the entry: should reject the order", () => {
    const result = buildTrade(tight);
    expect(result.entryType).toBe("confirmation");
    // Entry 100.10, target 100.07: exit on the wrong side, so no order.
    expect(result.order).toBeNull();
    expect(result.checks).toBeNull();
  });

  test("given the same zones scoring a proximal entry: should still produce a valid order", () => {
    // Bump the judged score to 8.5 so the entry sits on the proximal line.
    const result = buildTrade({ ...tight, strength: 2, time: 1, freshness: 0.5 });
    expect(result.entryType).toBe("proximal");
    expect(result.order?.entry).toBe(100);
    expect(result.order?.target).toBe(100.07);
    expect(result.order && result.order.target > result.order.entry).toBe(true);
  });
});

describe("given buildTrade and the Decision Matrix", () => {
  test("given a matrix no-trade cell with a qualifying score: should veto the order", () => {
    // Supply zone in the middle of the curve during an uptrend (row i): no trade,
    // even though the odds enhancers total 7.5, a confirmation entry.
    const result = buildTrade({
      accountBalance: 2500,
      riskTolerancePct: 0.02,
      targetBufferPct: 0.75,
      direction: "short",
      trend: "uptrend",
      timeframe: "daily",
      atr: 4,
      curveLow: 100,
      curveHigh: 130,
      entryProximal: 115,
      entryDistal: 117,
      targetProximal: 105,
      targetDistal: 103,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.scorecard.total).toBe(7.5);
    expect(result.entryType).toBe("confirmation");
    expect(result.objective).toBe("no-trade");
    expect(result.order).toBeNull();
    expect(result.checks).toBeNull();
  });

  test("given a matrix-approved setup: should set the objective and build the order", () => {
    const result = buildTrade(longTrade);
    expect(result.objective).toBe("long");
    expect(result.order).not.toBeNull();
  });
});

describe("given buildTrade and the 6% multiple-trade rule", () => {
  test("given open risk that would exceed 6%: should flag the multi-trade check", () => {
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
