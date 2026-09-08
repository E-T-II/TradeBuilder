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
export function locateOnCurve(
  price: number,
  low: number,
  high: number,
): CurveZone {
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
// rounds UP ("always round up when applicable"). `n * 100` alone can land a
// hair under a .5 boundary (4.015 * 100 === 401.49999999999994), which
// Math.round then rounds down instead of up; snapping to 15 significant
// digits first clears that float noise while keeping every other value exact.
export const roundToCent = (n: number) =>
  Math.round(Number((n * 100).toPrecision(15))) / 100;
const roundUpToCent = (n: number) => Math.ceil(n * 100 - 1e-9) / 100;

// A rate as a percent for display: 0.02 -> 2, keeping 4 decimals so a
// fractional rate stays precise, and rounding off the float noise the
// multiplication introduces (0.07 * 100 = 7.00…01). Shared by the risk limit
// and the stop buffer, the two rates the results screen quotes back.
const rateToPercent = (rate: number) => Math.round(rate * 1_000_000) / 10_000;

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

// Profit-zone ratios come from dividing decimal prices, so an exact 5:1 can
// compute as 4.9999999999. Compare thresholds with a small epsilon so the score
// and the Decision Matrix agree on the boundary. Shared by both.
export function meetsProfitRatio(ratio: number, threshold: number): boolean {
  return ratio >= threshold - 1e-9;
}

/** Profit zone points (max 2): >= 5:1 -> 2, >= 3:1 -> 1, below -> 0. */
export function profitZoneScore(ratio: number): number {
  if (meetsProfitRatio(ratio, 5)) return 2;
  if (meetsProfitRatio(ratio, 3)) return 1;
  return 0;
}

/** Which physical zone the trade enters at. Demand aims long, supply short. */
export type ZoneType = "demand" | "supply";

/** What the Decision Matrix resolves the trade to. */
export type TradeObjective = Direction | "no-trade";

// Decision Matrix (README step 3, rows a-r): the entry zone's type, where it
// sits on the curve, and the trend resolve the objective. Conditional cells
// require either a 3:1 or 5:1 profit-zone ratio; the rest are fixed.
type MatrixVerdict = "trade" | "needs-3to1" | "needs-5to1" | "no-trade";

const DECISION_MATRIX: Record<
  ZoneType,
  Record<CurveZone, Record<Trend, MatrixVerdict>>
> = {
  demand: {
    retail: {
      downtrend: "no-trade",
      sideways: "no-trade",
      uptrend: "needs-5to1",
    }, // d, e, f
    equilibrium: { downtrend: "no-trade", sideways: "trade", uptrend: "trade" }, // j, k, l
    wholesale: { downtrend: "needs-3to1", sideways: "trade", uptrend: "trade" }, // p, q, r
  },
  supply: {
    retail: { downtrend: "trade", sideways: "trade", uptrend: "needs-3to1" }, // a, b, c
    equilibrium: { downtrend: "trade", sideways: "trade", uptrend: "no-trade" }, // g, h, i
    wholesale: {
      downtrend: "needs-5to1",
      sideways: "no-trade",
      uptrend: "no-trade",
    }, // m, n, o
  },
};

/** Whether this matrix cell has additional XLT chart-validation criteria. */
export function isXltMatrixCell(
  zoneType: ZoneType,
  curve: CurveZone,
  trend: Trend,
): boolean {
  const verdict = DECISION_MATRIX[zoneType][curve][trend];
  return verdict === "needs-3to1" || verdict === "needs-5to1";
}

/**
 * Aggressive XLT setups must earn a proximal score before they may be entered.
 * Their execution is still confirmation-only, so the engine converts a
 * qualifying proximal score into a confirmation order.
 */
export function requiresXltProximalScore(
  zoneType: ZoneType,
  curve: CurveZone,
  trend: Trend,
): boolean {
  return (
    (zoneType === "demand" && curve === "retail" && trend === "uptrend") ||
    (zoneType === "supply" && curve === "wholesale" && trend === "downtrend")
  );
}

/**
 * Resolve the trade objective from the entry zone. A demand entry aims long, a
 * supply entry aims short, but the matrix can veto to no-trade. Conditional
 * cells require the specified 3:1 or 5:1 profit-zone threshold.
 */
export function decisionMatrix(
  zoneType: ZoneType,
  curve: CurveZone,
  trend: Trend,
  profitRatio: number,
): TradeObjective {
  const verdict = DECISION_MATRIX[zoneType][curve][trend];
  if (verdict === "no-trade") return "no-trade";
  const requiredRatio = matrixProfitZoneRequirement(verdict);
  if (requiredRatio !== null && !meetsProfitRatio(profitRatio, requiredRatio)) {
    return "no-trade";
  }
  return zoneType === "demand" ? "long" : "short";
}

function matrixProfitZoneRequirement(verdict: MatrixVerdict): number | null {
  if (verdict === "needs-5to1") return 5;
  if (verdict === "needs-3to1") return 3;
  return null;
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

/** Offset for a confirmation entry: 10 cents outside the proximal line. */
const CONFIRMATION_OFFSET = 0.1;

/**
 * The target buffer's allowed band, as whole-number percents of the profit
 * zone. This is the single source of truth for the 75-80% range: the engine
 * (auto's ceiling), the form's min/max, and the advanced-settings clamps all
 * read these so the bounds only ever live in one place.
 */
export const TARGET_BUFFER_MIN_PCT = 75;
export const TARGET_BUFFER_MAX_PCT = 80;

/**
 * The entry price. A proximal entry is a limit order right at the proximal
 * line. A confirmation entry waits for price to enter the zone and cross back
 * out, so the order rests 10 cents clear of the line on the outside — the near
 * side, before the zone starts: above proximal for a long demand zone, below it
 * for a short supply zone (README step 5). "Before" the line, not "past" it,
 * is Eugene's wording for that side.
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
 * Fraction of ATR the stop sits beyond the entry zone: 2% for daily income,
 * 10% for weekly or greater. The dollar buffer and the percent shown on the
 * ticket both derive from this, so a rule change moves them together.
 */
export function stopBufferRate(timeframe: IncomeTimeframe): number {
  return timeframe === "weekly" ? 0.1 : 0.02;
}

/**
 * Stop buffer: ATR x 2% for daily income, ATR x 10% for weekly or greater.
 * Always rounds up to the cent (NVDA example: 5.93 x 0.02 = 0.1186 -> 0.12).
 */
export function stopBuffer(atr: number, timeframe: IncomeTimeframe): number {
  return roundUpToCent(atr * stopBufferRate(timeframe));
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

/** Max account risk: balance x risk tolerance (2% max; the form caps it there). */
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

function targetPriceFromEntry(
  entry: number,
  targetProximal: number,
  bufferPct: number,
  direction: Direction,
): number {
  const zone = Math.abs(targetProximal - entry);
  return roundToCent(
    direction === "long"
      ? entry + zone * bufferPct
      : entry - zone * bufferPct,
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

/** The two zones the user draws on the chart, each by its high and low. */
export interface Zones {
  demandHigh: number;
  demandLow: number;
  supplyHigh: number;
  supplyLow: number;
}

/** The entry/target lines the engine works in, derived from the zones. */
export interface ZoneLines {
  entryProximal: number;
  entryDistal: number;
  targetProximal: number;
  targetDistal: number;
}

/**
 * Map the two physical zones to entry/target lines. Demand sits below, supply
 * above; direction picks which zone is the entry. A long enters at demand and
 * targets supply; a short is the mirror. Proximal is the edge price reaches
 * first: a demand zone's high, a supply zone's low.
 */
export function deriveZoneLines(zones: Zones, direction: Direction): ZoneLines {
  const { demandHigh, demandLow, supplyHigh, supplyLow } = zones;
  return direction === "long"
    ? {
      entryProximal: demandHigh,
      entryDistal: demandLow,
      targetProximal: supplyLow,
      targetDistal: supplyHigh,
    }
    : {
      entryProximal: supplyLow,
      entryDistal: supplyHigh,
      targetProximal: demandHigh,
      targetDistal: demandLow,
    };
}

/**
 * How the target is set:
 * - "percent": a % of the profit zone (targetBufferPct, kept in 0.75–0.80).
 * - "ratio": a mechanical 3:1 target (3x the per-share risk out from entry).
 * - "auto": the better reward:risk of the mechanical 3:1 and the percentage
 *   side. Auto scans the 75-80% range itself and, since the target grows with
 *   the buffer, effectively uses the 80% ceiling — it ignores the supplied
 *   targetBufferPct.
 */
export type TargetMode = "percent" | "ratio" | "auto";

/** Everything the user gives us. */
export interface TradeInputs {
  accountBalance: number;
  /** e.g. 0.02 for 2% risk per trade; the form caps this at 2% (0.02) */
  riskTolerancePct: number;
  /**
   * the take-profit buffer used in "percent" mode; kept in 0.75–0.80. "auto"
   * ignores this and scans the 75-80% range itself (effectively the 80%
   * ceiling); "ratio" doesn't use it at all.
   */
  targetBufferPct: number;
  /** how the target price is derived */
  targetMode: TargetMode;
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
    /** XLT Decision Matrix requirement for this cell, if conditional. */
    requiredProfitZoneRatio: number | null;
    /** XLT overrides a qualifying proximal score with confirmation execution. */
    confirmationRequiredByXlt: boolean;
    strength: number;
    time: number;
    freshness: number;
    total: number;
  };
  entryType: EntryType;
  /** The Decision Matrix verdict; "no-trade" means the matrix vetoed the setup. */
  objective: TradeObjective;
  /**
   * Why a qualifying setup still produced no order, so the results can explain
   * it. Undefined when there is an order, or when the no-trade reason is already
   * clear from objective/entryType:
   * - "tight-zones": the buffered target lands on the wrong side of the entry.
   * - "risk-too-small": the risk budget can't cover even one share's risk.
   * - "capital-too-large": one share costs more than the 50% capital cap allows.
  * - "xlt-proximal-score": this XLT setup requires an 8.5+ proximal score.
   * - "reward-risk": the best achievable reward:risk is below the 3:1 minimum.
   * - "over-6pct": this trade's risk plus open risk exceeds 6% of the balance.
   */
  blockedReason?:
  | "tight-zones"
  | "risk-too-small"
  | "capital-too-large"
  | "xlt-proximal-score"
  | "reward-risk"
  | "over-6pct";
  /**
   * The numbers behind a hard-rule rejection, so the copy can quantify the miss
   * instead of just naming the rule. Set alongside blockedReason, never on the
   * order path (the order carries its own figures).
   * - reachedRewardRisk: the ratio this setup actually reaches, on "reward-risk".
   *   Absent when the mechanical target overshot the opposing zone, where the
   *   rejected ratio isn't what the setup could have made.
   * - totalTradeRisk / openRisk: the two halves of the sum, on "over-6pct".
   *   Pair them with checks.multiTradeLimit for the size of the overage.
   */
  reachedRewardRisk?: number;
  totalTradeRisk?: number;
  openRisk?: number;
  /** null when there's no valid trade — see blockedReason, plus low score / matrix veto */
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
  /**
   * The working behind Stop/Target, for the results card's "show the math"
   * breakdown (per Eugene). Always present — every figure here follows from the
   * raw inputs — so the results screen can show it in gray even when there's no
   * order.
   *
   * targetMode echoes the mode the user selected, so the results screen can name
   * it (per Eugene: the user should know what was selected). targetBufferPct is
   * null when the target is a mechanical 3:1 (ratio mode, or auto picking the
   * mechanical target). targetBufferPending is true only in the one case the
   * buffer genuinely isn't settled yet: an auto setup that returned no order
   * *before* the 75-80%-vs-3:1 comparison ran — a matrix veto or a sub-7 score.
   * Every other result resolves the buffer, including auto no-trades rejected
   * *after* the comparison.
   */
  math: {
    dailyAtr: number;
    stopBufferPct: number;
    stopBufferDollar: number;
    targetMode: TargetMode;
    targetBufferPct: number | null;
    /** Dollar distance from entry proximal to the percentage-based target. */
    targetBufferDollar: number | null;
    targetBufferPending: boolean;
  };
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

  // Step 3 Decision Matrix: the entry zone (demand for a long, supply for a
  // short), its curve position, and the trend decide whether this is a valid
  // trade at all. It can veto even a high-scoring setup.
  const zoneType: ZoneType = inputs.direction === "long" ? "demand" : "supply";
  const objective = decisionMatrix(zoneType, curveZone, inputs.trend, ratio);
  const matrixVerdict = DECISION_MATRIX[zoneType][curveZone][inputs.trend];

  const scorecard = {
    curveZone,
    curve: curveScore(curveZone, inputs.direction),
    trend: trendScore(inputs.trend, inputs.direction),
    profitZoneRatio: ratio,
    profitZone: profitZoneScore(ratio),
    requiredProfitZoneRatio: matrixProfitZoneRequirement(matrixVerdict),
    confirmationRequiredByXlt: requiresXltProximalScore(
      zoneType,
      curveZone,
      inputs.trend,
    ),
    strength: inputs.strength,
    time: inputs.time,
    freshness: inputs.freshness,
    total: 0,
  };
  scorecard.total = totalScore(scorecard);

  const scoreType = entryType(scorecard.total);
  const requiresProximalScore = scorecard.confirmationRequiredByXlt;
  const type = scoreType === "no-trade" || (requiresProximalScore && scoreType !== "proximal")
    ? "no-trade"
    : requiresProximalScore
      ? "confirmation"
      : scoreType;
  const entry = type === "no-trade"
    ? null
    : entryPrice(inputs.entryProximal, type, inputs.direction);

  // The "show the math" figures (per Eugene), computed straight from the inputs
  // so they're available on every return — the results screen shows them in gray
  // even when there's no order. percent (the typed value) and ratio (mechanical,
  // null) know their buffer up front; auto's only settles once its 75-80%-vs-3:1
  // comparison runs, so it starts pending and the comparison clears the flag.
  // Pending-until-proven that way, any return that fires before the comparison
  // reports the buffer as unsettled without having to know it's early.
  const math = {
    dailyAtr: inputs.atr,
    stopBufferPct: rateToPercent(stopBufferRate(inputs.timeframe)),
    stopBufferDollar: stopBuffer(inputs.atr, inputs.timeframe),
    targetMode: inputs.targetMode,
    // A percent to two decimals, so roundToCent's float-noise guard is the one
    // this needs: a typed 75.045% is 7504.4999999… raw, which a plain round
    // would drop to 75.04 instead of 75.05.
    targetBufferPct:
      inputs.targetMode === "percent"
        ? roundToCent(inputs.targetBufferPct * 100)
        : null,
    targetBufferDollar:
      inputs.targetMode === "percent"
        ? roundToCent(
          Math.abs(inputs.targetProximal - (entry ?? inputs.entryProximal)) *
          inputs.targetBufferPct,
        )
        : null,
    targetBufferPending: inputs.targetMode === "auto",
  };

  // No order if the matrix vetoed the setup or the score didn't qualify.
  if (objective === "no-trade" || type === "no-trade") {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: requiresProximalScore && scoreType !== "proximal"
        ? "xlt-proximal-score"
        : undefined,
      math,
      order: null,
      checks: null,
    };
  }

  const executableEntry = entry!;
  const buffer = math.stopBufferDollar;
  const stop = stopLoss(inputs.entryDistal, buffer, inputs.direction);
  const riskPerShare = tradeRiskPerShare(executableEntry, stop);
  const maxRisk = maxAccountRisk(
    inputs.accountBalance,
    inputs.riskTolerancePct,
  );
  const rawSize = positionSize(maxRisk, riskPerShare);
  const size = applyCapitalCap(rawSize, executableEntry, inputs.accountBalance);

  // Target selection by mode. The percentage buffer is a % of the way to the
  // opposing zone (always inside it); the mechanical 3:1 is exactly 3x the
  // per-share risk out from the entry, so its reward:risk is 3 by construction.
  const percentTarget = targetPriceFromEntry(
    executableEntry,
    inputs.targetProximal,
    inputs.targetBufferPct,
    inputs.direction,
  );
  const percentRr = rewardRiskRatio(executableEntry, stop, percentTarget);
  const ratioTarget = roundToCent(
    inputs.direction === "long"
      ? executableEntry + riskPerShare * 3
      : executableEntry - riskPerShare * 3,
  );
  // The exit must sit strictly before the opposing zone's near edge: resting
  // the limit on the edge itself is the fill risk the 75-80% buffer exists to
  // avoid, so a mechanical target that lands exactly there doesn't count.
  const fitsZone = (t: number) =>
    inputs.direction === "long"
      ? t < inputs.targetProximal
      : t > inputs.targetProximal;

  // Auto checks every buffer from 75-80% against the mechanical 3:1 (per
  // Eugene) and keeps whichever gives the higher reward:risk without
  // overshooting the opposing zone. The target grows monotonically with the
  // buffer percentage, so the 80% ceiling always beats every lower percentage
  // in that range — comparing it to the 3:1 is equivalent to sweeping all six
  // and picking the best. Percentage targets always sit inside the zone, so
  // only the mechanical side needs the fitsZone check.
  const autoPercentTarget = targetPriceFromEntry(
    executableEntry,
    inputs.targetProximal,
    TARGET_BUFFER_MAX_PCT / 100,
    inputs.direction,
  );
  const autoPercentRr = rewardRiskRatio(executableEntry, stop, autoPercentTarget);

  // Each branch settles the target, the reward:risk and the displayed buffer
  // together, so the buffer can never drift from the comparison that produced
  // it. Auto clears its pending flag here and nowhere else: any return inserted
  // upstream of this block keeps reporting the buffer as unsettled, which is
  // exactly what it is.
  let target: number;
  let rr: number;
  if (inputs.targetMode === "ratio") {
    target = ratioTarget;
    // Mechanical targets are 3:1 by construction; recomputing from the
    // cent-rounded price could dip just under 3 and falsely trip the rule.
    rr = 3;
    // Mechanical targets use three times the per-share trade risk as the
    // dollar target buffer. The percentage remains null because none applies.
    math.targetBufferDollar = roundToCent(riskPerShare * 3);
  } else if (inputs.targetMode === "auto") {
    // The comparison has run either way, so the buffer is settled from here on.
    math.targetBufferPending = false;
    if (fitsZone(ratioTarget) && !meetsProfitRatio(autoPercentRr, 3)) {
      target = ratioTarget;
      rr = 3;
      // Mechanical won: no percentage applies, so the target buffer is three
      // times the per-share trade risk.
      math.targetBufferDollar = roundToCent(riskPerShare * 3);
    } else {
      target = autoPercentTarget;
      rr = autoPercentRr;
      // Percentage side won: report the 80% ceiling auto actually compared, not
      // the user's typed value.
      math.targetBufferPct = TARGET_BUFFER_MAX_PCT;
      math.targetBufferDollar = roundToCent(
        Math.abs(autoPercentTarget - executableEntry),
      );
    }
  } else {
    target = percentTarget;
    rr = percentRr;
    // Report the actual entry-to-target distance. Confirmation entries sit
    // $0.10 beyond proximal, shrinking the displayed dollar buffer by $0.10.
    math.targetBufferDollar = roundToCent(Math.abs(percentTarget - executableEntry));
  }

  // A tight zone plus the confirmation offset can push the computed entry past
  // the computed target, leaving an order whose exit sits on the wrong side of
  // the entry. That is not a tradeable setup, so return no order even though the
  // score qualified. entryType stays set so the results can explain why.
  const targetClears =
    inputs.direction === "long" ? target > executableEntry : target < executableEntry;
  if (!targetClears) {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: "tight-zones",
      math,
      order: null,
      checks: null,
    };
  }

  // Hard rule (per Eugene): the trade must make at least 3:1, or there is no
  // order at all. Reward:risk is a property of entry/stop/target alone — it
  // doesn't depend on the balance — so it is settled before the sizing guards
  // below, otherwise a small account is told to add funds for a setup that was
  // never tradeable at any size.
  //
  // A mechanical 3:1 target can land on or past the opposing zone's near edge,
  // which means 3:1 isn't reachable before that zone. Same rejection, but the
  // achievable ratio isn't this order's rr, so it stays unreported.
  // (Percentage targets always sit inside the zone.)
  if (!fitsZone(target)) {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: "reward-risk",
      math,
      order: null,
      checks: null,
    };
  }
  // The shared epsilon, so a mechanical 3:1 target isn't tripped by float noise
  // and this gate can't disagree with the check reported on the built order.
  if (!meetsProfitRatio(rr, 3)) {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: "reward-risk",
      reachedRewardRisk: rr,
      math,
      order: null,
      checks: null,
    };
  }

  // Zero shares has two distinct causes, and the remedies differ, so tell them
  // apart: rawSize 0 means the risk budget couldn't cover one share's risk;
  // otherwise the 50% capital cap knocked a positive size down to zero because
  // one share costs more than half the balance.
  if (size <= 0) {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: rawSize <= 0 ? "risk-too-small" : "capital-too-large",
      math,
      order: null,
      checks: null,
    };
  }

  const capital = roundToCent(size * executableEntry);
  const totalRisk = roundToCent(size * riskPerShare);
  const multiTradeLimit = roundToCent(inputs.accountBalance * 0.06);
  const openRisk = roundToCent(inputs.openTradeRisk ?? 0);
  // Every dollar figure here is cent-quantised, so quantise the sum too: added
  // as raw floats, a trade landing exactly on the 6% budget can come out a
  // fraction of a cent over and be rejected by a rule that allows it.
  const combinedRisk = roundToCent(totalRisk + openRisk);

  // Built once and shared by both exits below, so the card can't describe the
  // trade differently depending on which way the 6% rule went. Each line is
  // spelled exactly as its gate above, so it can never contradict the decision
  // that let an order through.
  const checks = {
    maxAccountRisk: maxRisk,
    // 4 decimals of a percent: cleans float noise (0.02 -> 2, not 2.0000004)
    // while keeping a sub-2% value (e.g. 1.5%) precise rather than rounded
    // to a flat whole percent for display.
    riskLimitPct: rateToPercent(inputs.riskTolerancePct),
    withinPerTradeRisk: totalRisk <= maxRisk,
    withinCapitalCap: capital <= inputs.accountBalance * 0.5,
    meetsRewardRisk: meetsProfitRatio(rr, 3),
    withinMultiTradeRisk: combinedRisk <= multiTradeLimit,
    multiTradeLimit,
  };

  // Hard rule (per Eugene): total open risk must stay within 6% of the balance.
  // Rejects outright rather than showing a flagged order — and carries its
  // numbers out, since the user has to resolve the overage themselves and can't
  // do that without seeing its size.
  if (!checks.withinMultiTradeRisk) {
    return {
      scorecard,
      entryType: type,
      objective,
      blockedReason: "over-6pct",
      openRisk,
      totalTradeRisk: totalRisk,
      math,
      order: null,
      checks,
    };
  }

  // Past every gate: the remaining checks are all satisfied by construction and
  // stay on so the results card can confirm what the trade cleared.
  return {
    scorecard,
    entryType: type,
    objective,
    order: {
      entry: executableEntry,
      stop,
      target,
      riskPerShare,
      rewardRisk: rr,
      positionSize: size,
      capitalRequirement: capital,
      totalTradeRisk: totalRisk,
    },
    math,
    checks,
  };
}
