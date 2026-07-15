// ── Trade Builder engine ───────────────────────────────────────────────
// Eugene's "Engineered Risk" logic, one small pure function at a time.
// No React in here — just math we can test in isolation.

/** Which way the trade is betting. */
export type Direction = "long" | "short";

/** The market trend the asset is currently in. */
export type Trend = "uptrend" | "sideways" | "downtrend";

/**
 * Scorecard factor #2 — TREND (max 2 points).
 *
 * Trading *with* the trend scores higher than fighting it.
 *   Long:  uptrend = 2, sideways = 1, downtrend = 0
 *   Short: the mirror image (downtrend = 2, sideways = 1, uptrend = 0)
 */
export function trendScore(trend: Trend, direction: Direction): number {
  if (direction === "long") {
    if (trend === "uptrend") return 2;
    if (trend === "sideways") return 1;
    return 0; // downtrend — fighting the current
  }

  // short: everything flips
  if (trend === "downtrend") return 2;
  if (trend === "sideways") return 1;
  return 0; // uptrend
}

/** Where a price sits in the big higher-timeframe range. */
export type CurveZone = "wholesale" | "equilibrium" | "retail";

/**
 * Split the range (low → high) into three equal slices and report which
 * one `price` falls in. A price sitting exactly on a boundary line counts
 * as the higher zone (we use `<`, not `<=`).
 *
 *   low ────110──── 120 ──── high   (for low=100, high=130)
 *   wholesale │ equilibrium │ retail
 */
export function locateOnCurve(price: number, low: number, high: number): CurveZone {
  const third = (high - low) / 3;
  if (price < low + third) return "wholesale";
  if (price < low + 2 * third) return "equilibrium";
  return "retail";
}

/**
 * Scorecard factor #1 — CURVE (max 1 point).
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
    return 0; // retail — buying expensive
  }

  // short: everything flips
  if (zone === "retail") return 1;
  if (zone === "equilibrium") return 0.5;
  return 0; // wholesale
}
