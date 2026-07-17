// Trade Builder engine: Eugene's "Engineered Risk" logic, one small pure
// function at a time. No React in here, just math we can test in isolation.

/** Which way the trade is betting. */
export type Direction = "long" | "short";

/** The market trend the asset is currently in. */
export type Trend = "uptrend" | "sideways" | "downtrend";

/**
 * Scorecard factor #2, TREND (max 2 points).
 *
 * Trading *with* the trend scores higher than fighting it.
 *   Long:  uptrend = 2, sideways = 1, downtrend = 0
 *   Short: the mirror image (downtrend = 2, sideways = 1, uptrend = 0)
 */
export function trendScore(trend: Trend, direction: Direction): number {
  if (direction === "long") {
    if (trend === "uptrend") return 2;
    if (trend === "sideways") return 1;
    return 0; // downtrend, fighting the current
  }

  // short: everything flips
  if (trend === "downtrend") return 2;
  if (trend === "sideways") return 1;
  return 0; // uptrend
}

/** Where a price sits in the big higher-timeframe range. */
export type CurveZone = "wholesale" | "equilibrium" | "retail";

/**
 * Split the range from low to high into three equal slices and report which
 * one `price` falls in. A price sitting exactly on a boundary line counts
 * as the higher zone (we use `<`, not `<=`).
 *
 * For low=100, high=130: wholesale is 100 to 110, equilibrium 110 to 120,
 * retail 120 to 130.
 */
export function locateOnCurve(price: number, low: number, high: number): CurveZone {
  const third = (high - low) / 3;
  if (price < low + third) return "wholesale";
  if (price < low + 2 * third) return "equilibrium";
  return "retail";
}

/**
 * Scorecard factor #1, CURVE (max 1 point).
 *
 * Buying long while price is down in wholesale (cheap) is high-odds;
 * doing it up in retail (expensive) is not. Short is the mirror image.
 *   Long:  wholesale = 1, equilibrium = 0.5, retail = 0
 *   Short: retail = 1, equilibrium = 0.5, wholesale = 0
 */
export function curveScore(zone: CurveZone, direction: Direction): number {
  if (direction === "long") {
    if (zone === "wholesale") return 1;
    if (zone === "equilibrium") return 0.5;
    return 0; // retail, buying expensive
  }

  // short: everything flips
  if (zone === "retail") return 1;
  if (zone === "equilibrium") return 0.5;
  return 0; // wholesale
}

/** How long the trader intends to hold: daily income or weekly-plus. */
export type IncomeTimeframe = "daily" | "weekly";

/** What the total score says to do. */
export type EntryType = "proximal" | "confirmation" | "no-trade";

// Money helpers, prices round to the cent, and the stop buffer always
// rounds UP ("always round up when applicable").
const roundToCent = (n: number) => Math.round(n * 100) / 100;
const roundUpToCent = (n: number) => Math.ceil(n * 100 - 1e-9) / 100;

/**
 * Scorecard factor #3, PROFIT ZONE ratio.
 *
 * How many times the entry zone's height fits into the distance between
 * the entry proximal and the target proximal. Bigger = more room to profit
 * relative to the zone you're risking from.
 */
export function profitZoneRatio(
  entryProximal: number,
  entryDistal: number,
  targetProximal: number,
): number {
  const zoneHeight = Math.abs(entryProximal - entryDistal);
  if (zoneHeight === 0) return 0; // degenerate zone, no meaningful ratio
  return Math.abs(targetProximal - entryProximal) / zoneHeight;
}

/** Profit zone points (max 2): >= 5:1 -> 2, >= 3:1 -> 1, below -> 0. */
export function profitZoneScore(ratio: number): number {
  if (ratio >= 5) return 2;
  if (ratio >= 3) return 1;
  return 0;
}

/** The user-judged factors and their maximums. Confirmed by Eugene. */
export const JUDGED_MAX = { strength: 2, time: 1, freshness: 2 } as const;

/** Sum the six odds enhancers into the total score out of 10. */
export function totalScore(factors: {
  curve: number;
  trend: number;
  profitZone: number;
  strength: number;
  time: number;
  freshness: number;
}): number {
  return (
    factors.curve +
    factors.trend +
    factors.profitZone +
    factors.strength +
    factors.time +
    factors.freshness
  );
}

/**
 * Score -> entry type: 8.5 and up is a proximal entry, 7 up to 8.5 is a
 * confirmation entry, below 7 is no trade. The README's 7-to-8 and 8.5-to-10
 * labels look like they skip 8 to 8.5, but a real scorecard can't land there:
 * every factor moves in 0.5 steps, so the total does too. (The function itself
 * takes any number; that 0.5 spacing comes from the scored inputs.) Confirmed
 * by Eugene.
 */
export function entryType(score: number): EntryType {
  if (score >= 8.5) return "proximal";
  if (score >= 7) return "confirmation";
  return "no-trade";
}

/** Offset for a confirmation entry: 10 cents past the proximal line. */
const CONFIRMATION_OFFSET = 0.1;

/**
 * The entry price. A proximal entry is a limit order right at the proximal
 * line. A confirmation entry waits for price to re-cross the proximal line,
 * so the order sits 10 cents past it (above for long, below for short -
 * mirrored per the strategy).
 */
export function entryPrice(
  entryProximal: number,
  type: EntryType,
  direction: Direction,
): number | null {
  if (type === "no-trade") return null;
  if (type === "proximal") return roundToCent(entryProximal);
  return roundToCent(
    direction === "long"
      ? entryProximal + CONFIRMATION_OFFSET
      : entryProximal - CONFIRMATION_OFFSET,
  );
}

/**
 * Stop buffer: ATR x 2% for daily income, ATR x 10% for weekly or greater.
 * Always rounds up to the cent (NVDA example: 5.93 x 0.02 = 0.1186 -> 0.12).
 */
export function stopBuffer(atr: number, timeframe: IncomeTimeframe): number {
  const multiplier = timeframe === "weekly" ? 0.1 : 0.02;
  return roundUpToCent(atr * multiplier);
}

/**
 * Stop loss goes behind the entry zone's distal line by the buffer:
 * subtracted from a demand zone distal (long), added to a supply zone
 * distal (short).
 */
export function stopLoss(
  entryDistal: number,
  buffer: number,
  direction: Direction,
): number {
  return roundToCent(
    direction === "long" ? entryDistal - buffer : entryDistal + buffer,
  );
}

/** Trade risk per share: distance between entry and stop. */
export function tradeRiskPerShare(entry: number, stop: number): number {
  return roundToCent(Math.abs(entry - stop));
}

/** Max account risk: balance x risk tolerance (up to 2%). */
export function maxAccountRisk(balance: number, riskPct: number): number {
  return roundToCent(balance * riskPct);
}

/** Position size: max account risk / trade risk per share, rounded down. */
export function positionSize(maxRisk: number, riskPerShare: number): number {
  if (riskPerShare <= 0) return 0; // entry == stop -> no valid trade
  return Math.floor(maxRisk / riskPerShare);
}

/**
 * Cap the position so its capital never exceeds 50% of the balance.
 * If it does, the adjusted size is 50% of balance / entry price, rounded
 * down, which lands on the same shares as Eugene's divide-then-divide
 * method in his scenarios (Ford: 22 and 4, Lucid: 12).
 */
export function applyCapitalCap(
  size: number,
  entry: number,
  balance: number,
): number {
  const capital = size * entry;
  const cap = balance * 0.5;
  if (capital <= cap) return size;
  return Math.floor(cap / entry);
}

/**
 * Target price: the profit zone (entry proximal to target proximal)
 * multiplied by the target buffer, measured out from the entry proximal.
 * Long targets sit above the entry, short targets below.
 */
export function targetPrice(
  entryProximal: number,
  targetProximal: number,
  bufferPct: number,
  direction: Direction,
): number {
  const zone = Math.abs(targetProximal - entryProximal);
  return roundToCent(
    direction === "long"
      ? entryProximal + zone * bufferPct
      : entryProximal - zone * bufferPct,
  );
}

/** Reward-to-risk: entry->target distance over risk per share. Needs >= 3. */
export function rewardRiskRatio(
  entry: number,
  stop: number,
  target: number,
): number {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return 0;
  return Math.abs(target - entry) / risk;
}

/** Everything the user gives us. */
export interface TradeInputs {
  accountBalance: number;
  /** e.g. 0.02 for the max 2% risk per trade */
  riskTolerancePct: number;
  /** 0.75 to 0.80 */
  targetBufferPct: number;
  direction: Direction;
  trend: Trend;
  timeframe: IncomeTimeframe;
  /** the asset's daily ATR, looked up by the user */
  atr: number;
  /** HTF demand zone distal, bottom of the curve */
  curveLow: number;
  /** HTF supply zone distal, top of the curve */
  curveHigh: number;
  entryProximal: number;
  entryDistal: number;
  targetProximal: number;
  targetDistal: number;
  /** user-judged odds enhancers (see JUDGED_MAX for the confirmed ranges) */
  strength: number;
  time: number;
  freshness: number;
  /** dollars already at risk across other open trades (for the 6% rule) */
  openTradeRisk?: number;
}

/** The complete result the app shows. */
export interface TradeResult {
  scorecard: {
    curveZone: CurveZone;
    curve: number;
    trend: number;
    profitZoneRatio: number;
    profitZone: number;
    strength: number;
    time: number;
    freshness: number;
    total: number;
  };
  entryType: EntryType;
  /** null when the score says no trade */
  order: {
    entry: number;
    stop: number;
    target: number;
    riskPerShare: number;
    rewardRisk: number;
    positionSize: number;
    capitalRequirement: number;
    totalTradeRisk: number;
  } | null;
  checks: {
    maxAccountRisk: number;
    /** The configured per-trade risk limit as a percent (2 by default). */
    riskLimitPct: number;
    withinPerTradeRisk: boolean;
    withinCapitalCap: boolean;
    meetsRewardRisk: boolean;
    /** 6% rule: this trade's risk + openTradeRisk vs 6% of balance */
    withinMultiTradeRisk: boolean;
    multiTradeLimit: number;
  } | null;
}

/**
 * The orchestrator: all the inputs in, the full scored trade out.
 * Pure, no state, no side effects, so the UI can call it on every
 * keystroke.
 */
export function buildTrade(inputs: TradeInputs): TradeResult {
  const curveZone = locateOnCurve(
    inputs.entryProximal,
    inputs.curveLow,
    inputs.curveHigh,
  );

  const ratio = profitZoneRatio(
    inputs.entryProximal,
    inputs.entryDistal,
    inputs.targetProximal,
  );

  const scorecard = {
    curveZone,
    curve: curveScore(curveZone, inputs.direction),
    trend: trendScore(inputs.trend, inputs.direction),
    profitZoneRatio: ratio,
    profitZone: profitZoneScore(ratio),
    strength: inputs.strength,
    time: inputs.time,
    freshness: inputs.freshness,
    total: 0,
  };
  scorecard.total = totalScore(scorecard);

  const type = entryType(scorecard.total);
  if (type === "no-trade") {
    return { scorecard, entryType: type, order: null, checks: null };
  }

  const entry = entryPrice(inputs.entryProximal, type, inputs.direction)!;
  const buffer = stopBuffer(inputs.atr, inputs.timeframe);
  const stop = stopLoss(inputs.entryDistal, buffer, inputs.direction);
  const riskPerShare = tradeRiskPerShare(entry, stop);
  const maxRisk = maxAccountRisk(
    inputs.accountBalance,
    inputs.riskTolerancePct,
  );
  const rawSize = positionSize(maxRisk, riskPerShare);
  const size = applyCapitalCap(rawSize, entry, inputs.accountBalance);
  const target = targetPrice(
    inputs.entryProximal,
    inputs.targetProximal,
    inputs.targetBufferPct,
    inputs.direction,
  );

  // A tight zone plus the confirmation offset can push the computed entry past
  // the computed target, leaving an order whose exit sits on the wrong side of
  // the entry. That is not a tradeable setup, so return no order even though the
  // score qualified. entryType stays set so the results can explain why.
  const targetClears =
    inputs.direction === "long" ? target > entry : target < entry;
  if (!targetClears) {
    return { scorecard, entryType: type, order: null, checks: null };
  }

  const rr = rewardRiskRatio(entry, stop, target);
  const capital = roundToCent(size * entry);
  const totalRisk = roundToCent(size * riskPerShare);
  const multiTradeLimit = roundToCent(inputs.accountBalance * 0.06);

  return {
    scorecard,
    entryType: type,
    order: {
      entry,
      stop,
      target,
      riskPerShare,
      rewardRisk: rr,
      positionSize: size,
      capitalRequirement: capital,
      totalTradeRisk: totalRisk,
    },
    checks: {
      maxAccountRisk: maxRisk,
      riskLimitPct: Math.round(inputs.riskTolerancePct * 10000) / 100,
      withinPerTradeRisk: totalRisk <= maxRisk,
      withinCapitalCap: capital <= inputs.accountBalance * 0.5,
      meetsRewardRisk: rr >= 3,
      withinMultiTradeRisk:
        totalRisk + (inputs.openTradeRisk ?? 0) <= multiTradeLimit,
      multiTradeLimit,
    },
  };
}
