import { describe, expect, test } from "vitest";
import {
  trendScore,
  locateOnCurve,
  curveScore,
  profitZoneRatio,
  profitZoneScore,
  meetsProfitRatio,
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
  isXltMatrixCell,
  deriveZoneLines,
  roundToCent,
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

  test("given an exact 5:1 from decimal prices: should still score 2 despite float error", () => {
    const ratio = profitZoneRatio(1.0, 0.97, 1.15); // 4.999999999999993
    expect(ratio).toBeLessThan(5); // the raw float dips just under 5
    expect(profitZoneScore(ratio)).toBe(2);
    // The Decision Matrix must agree: a needs-5to1 cell should trade, not veto.
    expect(decisionMatrix("demand", "wholesale", "downtrend", ratio)).toBe("long");
  });
});

describe("given meetsProfitRatio", () => {
  test("given a ratio at or above the threshold: should be true", () => {
    expect(meetsProfitRatio(5, 5)).toBe(true);
    expect(meetsProfitRatio(6, 5)).toBe(true);
  });

  test("given a ratio clearly below the threshold: should be false", () => {
    expect(meetsProfitRatio(4.9, 5)).toBe(false);
  });

  test("given a float that dips a hair under an exact threshold: should still be true", () => {
    // The bug this epsilon guards: an exact 5:1 computed from decimal prices
    // lands at 4.999999999999993, which a naive `>=` would reject.
    expect(4.999999999999993 >= 5).toBe(false); // proves the naive check fails
    expect(meetsProfitRatio(4.999999999999993, 5)).toBe(true);
  });

  test("given a value more than an epsilon below the threshold: should be false", () => {
    // The tolerance is only 1e-9, so a real miss isn't rounded up to a pass.
    expect(meetsProfitRatio(4.9999, 5)).toBe(false);
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

describe("given deriveZoneLines", () => {
  const zones = { demandHigh: 108, demandLow: 106, supplyHigh: 126, supplyLow: 124 };

  test("given a long: should enter at demand and target supply", () => {
    expect(deriveZoneLines(zones, "long")).toEqual({
      entryProximal: 108, // demand high
      entryDistal: 106, // demand low
      targetProximal: 124, // supply low
      targetDistal: 126, // supply high
    });
  });

  test("given a short: should mirror, entering at supply and targeting demand", () => {
    expect(deriveZoneLines(zones, "short")).toEqual({
      entryProximal: 124, // supply low
      entryDistal: 126, // supply high
      targetProximal: 108, // demand high
      targetDistal: 106, // demand low
    });
  });
});

describe("given decisionMatrix", () => {
  // Every cell of the README Decision Matrix (rows a-r). The profit ratio only
  // changes the outcome in the conditional cells. c and p require 3:1; f and m
  // require 5:1, so each appears at its threshold and just below it.
  const rows = [
    // supply zone -> short
    { row: "a", zone: "supply", curve: "retail", trend: "downtrend", ratio: 3, want: "short" },
    { row: "b", zone: "supply", curve: "retail", trend: "sideways", ratio: 3, want: "short" },
    { row: "c", zone: "supply", curve: "retail", trend: "uptrend", ratio: 3, want: "short" },
    { row: "c<", zone: "supply", curve: "retail", trend: "uptrend", ratio: 2.99, want: "no-trade" },
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
    { row: "p", zone: "demand", curve: "wholesale", trend: "downtrend", ratio: 3, want: "long" },
    { row: "p<", zone: "demand", curve: "wholesale", trend: "downtrend", ratio: 2.99, want: "no-trade" },
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

  test("given a needs-3to1 cell exactly at 3:1: should take the trade", () => {
    expect(decisionMatrix("demand", "wholesale", "downtrend", 3)).toBe("long");
  });

  test("should identify only conditional cells as XLT cells", () => {
    expect(isXltMatrixCell("demand", "wholesale", "downtrend")).toBe(true);
    expect(isXltMatrixCell("demand", "retail", "uptrend")).toBe(true);
    expect(isXltMatrixCell("supply", "retail", "uptrend")).toBe(true);
    expect(isXltMatrixCell("supply", "wholesale", "downtrend")).toBe(true);
    expect(isXltMatrixCell("demand", "wholesale", "uptrend")).toBe(false);
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

  test("given a confirmation entry: should place it 10 cents before the proximal line", () => {
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
  targetMode: "percent",
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
    expect(result.order?.target).toBe(120.03);
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
    expect(result.order?.target).toBe(109.98); // 121.90 - (121.90 - 106) x 75%
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
    targetMode: "percent",
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
    expect(result.blockedReason).toBe("tight-zones");
    // A post-comparison return: the buffer is settled, not the pending range.
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBe(75);
  });

  test("given the same tight zones in auto mode: should settle the buffer before rejecting", () => {
    // tight-zones is the first return downstream of auto's comparison, and auto
    // is the mode where the buffer isn't known up front — so this is where a
    // resolved buffer would most easily be missed and shown as a bare "Auto".
    const result = buildTrade({ ...tight, targetMode: "auto" });
    expect(result.blockedReason).toBe("tight-zones");
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBe(80); // the ceiling it compared
  });

  test("given the same zones scoring a proximal entry: should still produce a valid order", () => {
    // Bump the judged score to 8.5 so the entry sits on the proximal line.
    const result = buildTrade({ ...tight, strength: 2, time: 1, freshness: 0.5 });
    expect(result.entryType).toBe("proximal");
    expect(result.order?.entry).toBe(100);
    // Proximal entry remains at 100, so its target is 100 + 0.1 x 75%,
    // rounded up from the half-cent boundary.
    expect(result.order?.target).toBe(100.08);
    expect(result.order && result.order.target > result.order.entry).toBe(true);
  });
});

describe("given buildTrade where the position rounds to zero shares", () => {
  test("given a risk budget too small for one share's risk: should block as risk-too-small", () => {
    // Same qualifying setup as longTrade, but a $100 balance gives a $2 risk
    // budget while one share risks $2.18, so rawSize floors to 0.
    const result = buildTrade({ ...longTrade, accountBalance: 100 });
    expect(result.entryType).not.toBe("no-trade");
    expect(result.objective).toBe("long");
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("risk-too-small");
    // The gray box still has to fill: a sizing block is downstream of the
    // comparison, so percent's buffer is settled, not pending.
    expect(result.math.dailyAtr).toBe(4);
    expect(result.math.stopBufferDollar).toBe(0.08);
    expect(result.math.targetBufferPct).toBe(75);
    expect(result.math.targetBufferPending).toBe(false);
  });

  test("given one share costing over 50% of balance: should block as capital-too-large", () => {
    // Qualifying long: entry $60, tiny risk/share so the risk budget affords a
    // share (rawSize > 0), but one share ($60) exceeds 50% of a $100 balance,
    // so the capital cap knocks the size to 0.
    const result = buildTrade({
      accountBalance: 100,
      riskTolerancePct: 0.02,
      targetBufferPct: 0.75,
      targetMode: "percent",
      direction: "long",
      trend: "uptrend",
      timeframe: "daily",
      atr: 5, // buffer 0.10
      curveLow: 50,
      curveHigh: 80,
      entryProximal: 60,
      entryDistal: 59,
      targetProximal: 65,
      targetDistal: 66,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.entryType).not.toBe("no-trade");
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("capital-too-large");
    expect(result.math.dailyAtr).toBe(5);
    expect(result.math.stopBufferDollar).toBe(0.1);
    expect(result.math.targetBufferPct).toBe(75);
    expect(result.math.targetBufferPending).toBe(false);
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
      targetMode: "percent",
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

  test("given a matrix veto in auto mode: should report the math with the buffer pending", () => {
    // The other pre-comparison no-trade path (a matrix veto, not a sub-7 score),
    // on a short. Auto never ran its comparison, so the buffer is still pending —
    // and short direction doesn't change the ATR/stop-buffer math.
    const result = buildTrade({
      accountBalance: 2500,
      riskTolerancePct: 0.02,
      targetBufferPct: 0.75,
      targetMode: "auto",
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
    expect(result.objective).toBe("no-trade");
    expect(result.order).toBeNull();
    expect(result.math.dailyAtr).toBe(4);
    expect(result.math.stopBufferDollar).toBe(0.08);
    expect(result.math.targetBufferPending).toBe(true);
    expect(result.math.targetBufferPct).toBeNull();
  });

  test("given a matrix-approved setup: should set the objective and build the order", () => {
    const result = buildTrade(longTrade);
    expect(result.objective).toBe("long");
    expect(result.order).not.toBeNull();
  });
});

describe("given buildTrade and the configured risk limit", () => {
  test("given the default 2%: should report riskLimitPct as 2", () => {
    expect(buildTrade(longTrade).checks?.riskLimitPct).toBe(2);
  });

  // The form caps risk at 2%, but a user can dial it lower; the reported
  // percent keeps fine precision rather than rounding to a whole number.
  test("given a sub-2% risk: should report it precisely, not rounded", () => {
    const result = buildTrade({ ...longTrade, riskTolerancePct: 0.015 });
    expect(result.checks?.riskLimitPct).toBe(1.5);
  });
});

describe("given buildTrade and the target modes", () => {
  // Proximal long: entry 108, stop 105.92, risk 2.08. Percentage (75%) target
  // is 120 (~5.8:1); the mechanical 3:1 target is 114.24.
  const proximal: TradeInputs = {
    ...longTrade,
    strength: 2,
    time: 1,
    freshness: 2, // total 9 -> proximal
  };

  test('given "ratio" mode: should exit at the mechanical 3:1 target', () => {
    const result = buildTrade({ ...proximal, targetMode: "ratio" });
    expect(result.order?.target).toBe(114.24);
    expect(result.order?.rewardRisk).toBe(3);
  });

  test('given "auto" with a percentage that beats 3:1: should keep the percentage target, at the 80% ceiling', () => {
    // Auto checks every buffer 75-80% against the mechanical 3:1 (per Eugene);
    // 80% always wins among the percentages, so that's the one it keeps.
    // 108 + (124 - 108) x 80% = 120.8.
    const result = buildTrade({ ...proximal, targetMode: "auto" });
    expect(result.order?.target).toBe(120.8);
    expect(result.order?.rewardRisk).toBeGreaterThan(3);
  });

  test('given "auto" where the percentage misses 3:1 but the mechanical fits: should switch to 3:1', () => {
    // Target zone at 115 -> 75% buffer is only ~2.5:1, but the 3:1 target (114.24)
    // still sits below the zone, so auto rescues it.
    const near = { ...proximal, targetProximal: 115, targetDistal: 117 };
    expect(buildTrade({ ...near, targetMode: "percent" }).blockedReason).toBe(
      "reward-risk",
    );
    const auto = buildTrade({ ...near, targetMode: "auto" });
    expect(auto.order?.target).toBe(114.24);
    expect(auto.order?.rewardRisk).toBe(3);
  });

  test('given "auto" where the entered buffer misses 3:1 but 80% clears it: should use 80%, not the mechanical', () => {
    // Target zone at 116 -> the entered 75% buffer gives only ~2.88:1, which
    // would have fallen back to the mechanical 3:1 before Eugene's sweep. The
    // 80% ceiling gives ~3.08:1, so auto now keeps the percentage instead.
    const wider = { ...proximal, targetProximal: 116, targetDistal: 118 };
    expect(buildTrade({ ...wider, targetMode: "percent" }).blockedReason).toBe(
      "reward-risk",
    );
    const auto = buildTrade({ ...wider, targetMode: "auto" });
    expect(auto.order?.target).toBe(114.4); // 108 + 8 x 80%
    expect(auto.order?.rewardRisk).toBeGreaterThan(3);
    expect(auto.math.targetBufferPct).toBe(80);
  });

  test('given "auto" where neither candidate reaches 3:1: should reject', () => {
    // Zone at 112 leaves the percentage short of 3:1 and puts the mechanical
    // 3:1 target (114.24) outside the zone, so auto has nothing to fall back on.
    const result = buildTrade({
      ...proximal,
      targetProximal: 112,
      targetDistal: 114,
      targetMode: "auto",
    });
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("reward-risk");
    // Auto ran its comparison before rejecting, so the buffer is settled — it
    // must NOT still read as pending (the 75-80% range). The percentage side is
    // the one it compared, so it resolves to the 80% ceiling.
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBe(80);
  });

  test('given "auto" that picks the mechanical target then fails the 6% rule: should report Mechanical 3:1, not the range', () => {
    // Auto picks the mechanical 3:1, clears the reward-risk gate,
    // then a large open risk trips the 6% rule. The comparison ran, so the
    // buffer is settled to null (mechanical), never the pending 75-80% range.
    const result = buildTrade({
      ...proximal,
      targetProximal: 115,
      targetDistal: 117,
      targetMode: "auto",
      openTradeRisk: 1_000,
    });
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("over-6pct");
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBeNull();
  });

  test("given a percentage target at exactly 3:1: should allow it", () => {
    // The boundary the rule is written on: 3:1 is "at least 3:1", so the trade
    // stands. A `>=` drifting to `>` here would silently start rejecting it.
    // Entry 108, stop 105.92, risk 2.08; a 75% buffer to a 116.32 zone lands
    // on 114.24, exactly 3x the risk out from the entry.
    const result = buildTrade({
      ...proximal,
      targetProximal: 116.32,
      targetDistal: 118,
    });
    expect(result.order?.target).toBe(114.24);
    expect(result.order?.rewardRisk).toBeCloseTo(3, 9);
    expect(result.order).not.toBeNull();
    expect(result.checks?.meetsRewardRisk).toBe(true);
  });

  test('given "ratio" mode whose target lands exactly on the zone edge: should reject', () => {
    // fitsZone is strict: a target resting on targetProximal is the fill risk
    // the buffer exists to avoid. entryDistal 106.08 -> stop 106, risk exactly
    // 2, so the mechanical 3:1 target is 108 + 2 x 3 = 114 === targetProximal.
    // A `<` drifting to `<=` here would silently start building this order.
    const result = buildTrade({
      ...proximal,
      entryDistal: 106.08,
      targetProximal: 114,
      targetDistal: 116,
      targetMode: "ratio",
    });
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("reward-risk");
  });

  // Both target modes branch on direction, so a flipped sign in either ternary
  // would ship green against long-only coverage.
  describe("given a short setup", () => {
    // Proximal short off a supply zone: entry 124, stop 126.08, risk 2.08.
    const short: TradeInputs = {
      ...proximal,
      direction: "short",
      trend: "downtrend",
      entryProximal: 124,
      entryDistal: 126,
      targetProximal: 108,
      targetDistal: 106,
    };

    test('given "ratio" mode: should place the mechanical 3:1 target below the entry', () => {
      const result = buildTrade({ ...short, targetMode: "ratio" });
      expect(result.order?.entry).toBe(124);
      expect(result.order?.target).toBe(117.76); // 124 - 3 x 2.08
      expect(result.order?.rewardRisk).toBe(3);
    });

    test('given "auto" with a percentage that beats 3:1: should keep the percentage target, at the 80% ceiling', () => {
      // 124 - (124 - 108) x 80% = 111.2.
      const result = buildTrade({ ...short, targetMode: "auto" });
      expect(result.order?.target).toBe(111.2);
      expect(result.order!.rewardRisk).toBeGreaterThan(3);
    });

    test('given "auto" where only the mechanical 3:1 fits: should switch to it', () => {
      const near = { ...short, targetProximal: 117, targetDistal: 115 };
      expect(buildTrade({ ...near, targetMode: "percent" }).blockedReason).toBe(
        "reward-risk",
      );
      const auto = buildTrade({ ...near, targetMode: "auto" });
      expect(auto.order?.target).toBe(117.76);
      expect(auto.order?.rewardRisk).toBe(3);
    });

    test('given "ratio" mode where 3:1 overshoots the zone: should reject', () => {
      const result = buildTrade({
        ...short,
        targetProximal: 120,
        targetDistal: 118,
        targetMode: "ratio",
      });
      expect(result.order).toBeNull();
      expect(result.blockedReason).toBe("reward-risk");
    });

    test('given "auto" where neither candidate reaches 3:1: should reject', () => {
      // Mirror of the long case: zone at 120 leaves the percentage short of 3:1
      // and puts the mechanical target (117.76) above it, so auto has nothing to
      // fall back on.
      const result = buildTrade({
        ...short,
        targetProximal: 120,
        targetDistal: 118,
        targetMode: "auto",
      });
      expect(result.order).toBeNull();
      expect(result.blockedReason).toBe("reward-risk");
    });
  });

  test('given "ratio" mode where 3:1 overshoots the zone: should reject', () => {
    // Zone at 112 is closer than the 3:1 target (114.24), so 3:1 can't be
    // reached before the opposing zone.
    const result = buildTrade({
      ...proximal,
      targetProximal: 112,
      targetDistal: 114,
      targetMode: "ratio",
    });
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("reward-risk");
  });
});

describe("given buildTrade's S.E.T.S. breakdown", () => {
  // Same proximal long as the target-mode tests above: entry 108, stop 105.92,
  // risk 2.08, daily ATR 4, percentage target 120, mechanical target 114.24.
  const proximal: TradeInputs = {
    ...longTrade,
    strength: 2,
    time: 1,
    freshness: 2,
  };

  test("given percent mode: should report the buffer %, ATR, and stop buffer", () => {
    const result = buildTrade({ ...proximal, targetMode: "percent" });
    expect(result.math.targetBufferPct).toBe(75);
    expect(result.math.dailyAtr).toBe(4);
    expect(result.math.stopBufferPct).toBe(2);
    expect(result.math.stopBufferDollar).toBe(0.08);
  });

  test("given a fractional buffer: should report it to two decimals", () => {
    // The fraction -> percent conversion has to keep two decimals: 0.7733
    // becomes 77.33, not 77 or 7733. A plainer formula (e.g. * 100 with no
    // rounding, or rounding to a whole number) would slip past the round
    // 0.75/0.80 fixtures above but fail here.
    const result = buildTrade({
      ...proximal,
      targetMode: "percent",
      targetBufferPct: 0.7733,
    });
    expect(result.math.targetBufferPct).toBe(77.33);
  });

  test('given "ratio" mode: should report no target buffer %', () => {
    const result = buildTrade({ ...proximal, targetMode: "ratio" });
    expect(result.math.targetBufferPct).toBeNull();
  });

  test('given "auto" picking the percentage: should report the 80% ceiling it actually used', () => {
    // Auto always checks the 80% ceiling, not the user's typed buffer, so
    // that's what this line reports when the percentage side wins.
    const result = buildTrade({ ...proximal, targetMode: "auto" });
    expect(result.order?.target).toBe(120.8); // confirms percentage won
    expect(result.math.targetBufferPct).toBe(80);
  });

  test('given "auto" picking the mechanical target: should report no %', () => {
    const near = { ...proximal, targetProximal: 115, targetDistal: 117 };
    const result = buildTrade({ ...near, targetMode: "auto" });
    expect(result.order?.target).toBe(114.24); // confirms the mechanical won
    expect(result.math.targetBufferPct).toBeNull();
  });

  test("given a weekly income objective: should report the 10% stop buffer", () => {
    const result = buildTrade({
      ...proximal,
      timeframe: "weekly",
      targetMode: "percent",
    });
    expect(result.math.stopBufferPct).toBe(10);
    expect(result.math.stopBufferDollar).toBe(0.4); // 4 x 10%
  });

  test("given no trade: should still report the math from the inputs", () => {
    // A sub-7 score returns no order, but the ATR and stop buffer are pure
    // input math (per Eugene: show it in gray anyway). Auto hasn't run its
    // comparison, so the target buffer is pending, not a settled percentage.
    const result = buildTrade({
      ...longTrade,
      strength: 0,
      time: 0,
      freshness: 0,
      targetMode: "auto",
    });
    expect(result.order).toBeNull();
    expect(result.math.dailyAtr).toBe(4);
    expect(result.math.stopBufferPct).toBe(2);
    expect(result.math.stopBufferDollar).toBe(0.08);
    expect(result.math.targetMode).toBe("auto"); // echoes what was selected
    expect(result.math.targetBufferPending).toBe(true);
    expect(result.math.targetBufferPct).toBeNull();
  });

  test("given no trade in percent mode: should report the typed buffer, settled", () => {
    // Percent and ratio never run auto's comparison either, but their buffer is
    // known up front, so a no-trade result is settled (not pending) — percent
    // reports the typed value.
    const result = buildTrade({
      ...longTrade,
      strength: 0,
      time: 0,
      freshness: 0,
      targetMode: "percent",
      targetBufferPct: 0.78,
    });
    expect(result.order).toBeNull();
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBe(78);
  });

  test("given no trade in ratio mode: should report mechanical, settled", () => {
    const result = buildTrade({
      ...longTrade,
      strength: 0,
      time: 0,
      freshness: 0,
      targetMode: "ratio",
    });
    expect(result.order).toBeNull();
    expect(result.math.targetBufferPending).toBe(false);
    expect(result.math.targetBufferPct).toBeNull();
  });

  test("given a typed buffer on a half-cent boundary: should round the percent up", () => {
    // 75.045% is 7504.4999… raw; without the precision guard Math.round drops it
    // to 75.04. Display-only, but it's the buffer the ticket shows.
    const result = buildTrade({
      ...proximal,
      targetMode: "percent",
      targetBufferPct: 0.75045,
    });
    expect(result.math.targetBufferPct).toBe(75.05);
  });
});

describe("given buildTrade and the 3:1 reward-risk rule", () => {
  test("given a qualifying setup whose reward:risk is below 3:1: should reject outright", () => {
    // Long, proximal, matrix-approved, sizes fine — but a nearby target zone
    // gives only ~2.16:1 after the 75% buffer, under the 3:1 minimum.
    const result = buildTrade({
      ...longTrade,
      strength: 2,
      time: 1,
      freshness: 2, // total 9 -> proximal
      entryProximal: 108,
      entryDistal: 106,
      targetProximal: 114,
      targetDistal: 116,
    });
    expect(result.entryType).not.toBe("no-trade");
    expect(result.objective).toBe("long");
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("reward-risk");
  });

  test("given a setup that clears 3:1: should build the order", () => {
    const result = buildTrade({ ...longTrade, strength: 2, time: 1, freshness: 2 });
    expect(result.order).not.toBeNull();
    expect(result.order!.rewardRisk).toBeGreaterThanOrEqual(3);
  });

  test("given a rejection: should report the ratio the setup actually reaches", () => {
    // "Needs a farther target" is unactionable on its own — 2.9 and 1.2 call
    // for very different fixes — so the miss travels with the rejection.
    const result = buildTrade({
      ...longTrade,
      strength: 2,
      time: 1,
      freshness: 2,
      targetProximal: 114,
      targetDistal: 116,
    });
    expect(result.blockedReason).toBe("reward-risk");
    expect(result.reachedRewardRisk).toBeCloseTo(2.16, 2);
  });

  test("given a reward:risk a float hair under 3: should agree with the check it reports", () => {
    // rewardRisk computes as 2.9999999999999956 here. The gate clears it via
    // meetsProfitRatio's epsilon, so the risk card must not then call it a
    // failure on the very order the gate let through.
    const result = buildTrade({
      ...longTrade,
      entryProximal: 1,
      entryDistal: 0.96,
      targetProximal: 1.2,
      targetDistal: 1.3,
      atr: 0.5,
      curveLow: 0.9,
      curveHigh: 1.5,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.order?.rewardRisk).toBeLessThan(3);
    expect(result.order?.rewardRisk).toBeCloseTo(3, 9);
    expect(result.checks?.meetsRewardRisk).toBe(true);
  });

  test("given a setup that can never reach 3:1: should say so rather than blame the balance", () => {
    // Reward:risk is a property of entry/stop/target alone, so a $20 account
    // and a $2500 one must get the same verdict — otherwise the user funds the
    // account and only then learns the setup was never tradeable.
    const unreachable = {
      ...longTrade,
      entryDistal: 107.5,
      targetProximal: 110.5,
      targetDistal: 111,
    };
    expect(buildTrade({ ...unreachable, accountBalance: 2500 }).blockedReason).toBe(
      "reward-risk",
    );
    expect(buildTrade({ ...unreachable, accountBalance: 20 }).blockedReason).toBe(
      "reward-risk",
    );
  });
});

describe("given buildTrade and the 6% multiple-trade rule", () => {
  // $600 account -> $36 limit; this trade risks well under that on its own.
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

  test("given open risk within 6%: should build the order and confirm the check", () => {
    const fine = buildTrade({ ...base, openTradeRisk: 20 });
    expect(fine.order).not.toBeNull();
    expect(fine.checks?.withinMultiTradeRisk).toBe(true);
    expect(fine.checks?.multiTradeLimit).toBe(36);
  });

  test("given open risk that would exceed 6%: should reject the trade outright", () => {
    const over = buildTrade({ ...base, openTradeRisk: 30 });
    expect(over.order).toBeNull();
    expect(over.blockedReason).toBe("over-6pct");
  });

  test("given a rejection: should carry the numbers behind the overage", () => {
    // The user has to resolve this themselves, which they can't do without the
    // limit, their open risk, and this trade's risk.
    const over = buildTrade({ ...base, openTradeRisk: 30 });
    expect(over.checks?.multiTradeLimit).toBe(36);
    expect(over.checks?.withinMultiTradeRisk).toBe(false);
    expect(over.openRisk).toBe(30);
    expect(over.totalTradeRisk).toBeGreaterThan(0);
    expect(over.openRisk! + over.totalTradeRisk!).toBeGreaterThan(36);
  });

  test("given risk landing exactly on the 6% limit: should allow the trade", () => {
    // "Should not exceed $36" allows $36. Summed as raw floats these land on
    // 6.010000000000001-style values and a bare `>` rejects a legal trade.
    const exact = buildTrade({
      ...base,
      accountBalance: 100.25, // -> $6.02 limit, $1.08 trade risk
      openTradeRisk: 4.94, // 1.08 + 4.94 === 6.0200000000000005 as floats
    });
    expect(exact.checks?.multiTradeLimit).toBe(6.02);
    expect(exact.order?.totalTradeRisk).toBe(1.08);
    expect(exact.blockedReason).toBeUndefined();
    expect(exact.order).not.toBeNull();
    expect(exact.checks?.withinMultiTradeRisk).toBe(true);
  });

  test("given a sub-cent open risk: should quantise it before comparing", () => {
    // openTradeRisk arrives straight from a free-typed field, so it can carry
    // fractions of a cent into a cent-quantised comparison.
    const typed = buildTrade({ ...base, openTradeRisk: 30.005 });
    const rounded = buildTrade({ ...base, openTradeRisk: 30.01 });
    expect(typed.blockedReason).toBe(rounded.blockedReason);
    expect(typed.openRisk).toBe(30.01);
  });

  test("given a half-cent open risk whose float noise rounds the wrong way: should still reject", () => {
    // 30.005 happens to round correctly by luck of its float representation;
    // 28.085 does not (28.085 * 100 === 2808.4999999999995), so a naive
    // Math.round(n * 100) / 100 rounds it down to 28.08 instead of 28.09. This
    // trade's own risk is 7.92, so the wrong rounding lands combined risk at
    // exactly 36.00 (allowed) instead of the true 36.01 (over the $36 limit).
    const typed = buildTrade({ ...base, openTradeRisk: 28.085 });
    const rounded = buildTrade({ ...base, openTradeRisk: 28.09 });
    expect(typed.blockedReason).toBe(rounded.blockedReason);
    expect(typed.blockedReason).toBe("over-6pct");
    expect(typed.openRisk).toBe(28.09);
  });
});

describe("given roundToCent", () => {
  test("given a value exactly on the half-cent boundary: should round up despite float noise", () => {
    // 4.015 * 100 === 401.49999999999994 and 1.005 * 100 === 100.49999999999999
    // in IEEE754, so a bare Math.round(n * 100) / 100 rounds both down. This
    // is the exact defect that let a $100-balance, $1.99-risk trade with
    // openTradeRisk "4.015" clear the 6% gate at $6.00 when it should be
    // rejected at $6.01.
    expect(roundToCent(4.015)).toBe(4.02);
    expect(roundToCent(1.005)).toBe(1.01);
  });

  test("given ordinary values: should round exactly as before", () => {
    expect(roundToCent(105.92)).toBe(105.92);
    expect(roundToCent(2.08)).toBe(2.08);
    expect(roundToCent(0)).toBe(0);
  });
});
