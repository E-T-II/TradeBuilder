/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

import {
  isXltMatrixCell,
  type CurveZone,
  type Trend,
  type ZoneType,
} from "@/lib/trade-builder";

/**
 * The XLT chart-validation checklist for a conditional Decision Matrix cell.
 * Scenario 1 is the counter-trend reversal (3:1, confirmation entry only);
 * Scenario 2 is the aggressive trend continuation at the curve extreme (5:1).
 */
export interface XltScenario {
  scenario: 1 | 2;
  title: string;
  description: string;
  requiredProfitZoneRatio: 3 | 5;
  items: string[];
}

export function xltScenario(
  zoneType: ZoneType,
  curve: CurveZone,
  trend: Trend,
): XltScenario | null {
  if (!isXltMatrixCell(zoneType, curve, trend)) return null;

  const short = zoneType === "supply";
  const target = short ? "demand" : "supply";
  // Scenario 1 trades against the ITF trend expecting a reversal; its cells
  // are the 3:1 cells (c and p). The remaining XLT cells (m and f) are the
  // 5:1 Scenario 2 continuation trades at the hostile end of the curve.
  const scenario1 =
    (zoneType === "supply" && curve === "retail" && trend === "uptrend") ||
    (zoneType === "demand" && curve === "wholesale" && trend === "downtrend");

  const shared = [
    `Structure: the ${zoneType} zone is a clean ${
      short ? "drop-base-drop or rally-base-drop" : "rally-base-rally or drop-base-rally"
    } formation.`,
    "Base duration: the base has no more than 3–4 tightly packed candles (1–2 optimal). A base of 5 or more candles disqualifies.",
    `Price arrival: price is returning to the ${zoneType} zone impulsively with long-legged candles, not slow, grinding, or choppy consolidation.`,
    `Opposing path: every intervening opposing structure between the zone and the target scores below 7 on the odds enhancers.`,
  ];

  return scenario1
    ? {
        scenario: 1,
        title: `XLT ${short ? "Short" : "Long"} Scenario 1 - counter-trend reversal`,
        description: short
          ? "Shorting supply at the retail extreme against the ITF uptrend. Confirmation entry only. The scorecard must show strength 2/2, freshness 2/2, time at least 0.5, and profit zone at least 3:1."
          : "Buying demand at the wholesale extreme against the ITF downtrend. Confirmation entry only. The scorecard must show strength 2/2, freshness 2/2, time at least 0.5, and profit zone at least 3:1.",
        requiredProfitZoneRatio: 3,
        items: [
          ...shared,
          `HTF overlap: the ${zoneType} zone overlaps a higher-timeframe zone where the ${
            short ? "uptrend" : "downtrend"
          } is expected to end.`,
        ],
      }
    : {
        scenario: 2,
        title: `XLT ${short ? "Short" : "Long"} Scenario 2 - aggressive trend continuation`,
        description: short
          ? "Shorting with the ITF downtrend, but deep in the wholesale range near HTF demand. The scorecard must show strength 2/2, freshness 2/2, time at least 0.5, and profit zone at least 5:1."
          : "Buying with the ITF uptrend, but deep in the retail range near HTF supply. The scorecard must show strength 2/2, freshness 2/2, time at least 0.5, and profit zone at least 5:1.",
        requiredProfitZoneRatio: 5,
        items: [
          ...shared,
          `HTF proximal line: the higher-timeframe ${target} zone's proximal line leaves room for the full 5:1. No clean HTF proximal line to check means pass on the trade.`,
        ],
      };
}

// The acknowledgement is stored as one string so backups keep their shape:
// "<cellKey>|v2:<checked indexes>". Versioning prevents an older checklist's
// indexes from being mistaken for these chart-only checks. A bare cell key
// (the original single-checkbox format) counts as fully verified.
export function parseXltChecked(
  value: string,
  cellKey: string,
  itemCount: number,
): Set<number> {
  if (value === cellKey) {
    return new Set(Array.from({ length: itemCount }, (_, index) => index));
  }
  const prefix = `${cellKey}|v2:`;
  if (!value.startsWith(prefix)) return new Set();
  const checked = new Set<number>();
  for (const part of value.slice(prefix.length).split(",")) {
    const index = Number(part);
    if (Number.isInteger(index) && index >= 0 && index < itemCount) {
      checked.add(index);
    }
  }
  return checked;
}

export function serializeXltChecked(
  cellKey: string,
  checked: Set<number>,
): string {
  if (checked.size === 0) return "";
  return `${cellKey}|v2:${[...checked].sort((a, b) => a - b).join(",")}`;
}

export function isXltVerified(
  value: string,
  cellKey: string,
  itemCount: number,
): boolean {
  return parseXltChecked(value, cellKey, itemCount).size === itemCount;
}
