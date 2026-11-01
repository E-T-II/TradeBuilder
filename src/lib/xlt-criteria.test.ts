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

import { describe, expect, test } from "vitest";

import {
  isXltVerified,
  parseXltChecked,
  serializeXltChecked,
  xltScenario,
} from "@/lib/xlt-criteria";

describe("given the four XLT matrix cells", () => {
  test("should map the counter-trend reversal cells (c and p) to Scenario 1", () => {
    const short = xltScenario("supply", "retail", "uptrend");
    const long = xltScenario("demand", "wholesale", "downtrend");
    expect(short?.scenario).toBe(1);
    expect(long?.scenario).toBe(1);
    expect(short?.title).toBe("XLT Short Scenario 1 - counter-trend reversal");
    expect(long?.title).toBe("XLT Long Scenario 1 - counter-trend reversal");
    // Scenario 1's scorecard threshold is 3:1, plus the HTF overlap check.
    expect(short?.requiredProfitZoneRatio).toBe(3);
    expect(short?.items.join(" ")).toMatch(/overlaps a higher-timeframe zone/);
    expect(long?.requiredProfitZoneRatio).toBe(3);
  });

  test("should map the aggressive continuation cells (m and f) to Scenario 2", () => {
    const short = xltScenario("supply", "wholesale", "downtrend");
    const long = xltScenario("demand", "retail", "uptrend");
    expect(short?.scenario).toBe(2);
    expect(long?.scenario).toBe(2);
    expect(short?.title).toBe("XLT Short Scenario 2 - aggressive trend continuation");
    expect(long?.title).toBe("XLT Long Scenario 2 - aggressive trend continuation");
    // Scenario 2's scorecard threshold is 5:1, plus the HTF proximal check.
    expect(short?.requiredProfitZoneRatio).toBe(5);
    expect(short?.items.join(" ")).toMatch(/proximal line/);
    expect(long?.requiredProfitZoneRatio).toBe(5);
  });

  test("should phrase the structure check for the trade direction", () => {
    expect(xltScenario("supply", "retail", "uptrend")?.items[0]).toMatch(
      /drop-base-drop or rally-base-drop/,
    );
    expect(xltScenario("demand", "wholesale", "downtrend")?.items[0]).toMatch(
      /rally-base-rally or drop-base-rally/,
    );
  });

  test("should return null for every non-XLT cell", () => {
    expect(xltScenario("demand", "equilibrium", "uptrend")).toBeNull();
    expect(xltScenario("supply", "retail", "downtrend")).toBeNull();
    expect(xltScenario("demand", "retail", "downtrend")).toBeNull();
    expect(xltScenario("supply", "wholesale", "uptrend")).toBeNull();
  });
});

describe("given the checklist acknowledgement string", () => {
  const cellKey = "supply:retail:uptrend";

  test("should round-trip checked items through serialize and parse", () => {
    const value = serializeXltChecked(cellKey, new Set([3, 0, 4]));
    expect(value).toBe(`${cellKey}|v2:0,3,4`);
    expect([...parseXltChecked(value, cellKey, 5)].sort()).toEqual([0, 3, 4]);
    expect(isXltVerified(value, cellKey, 5)).toBe(false);
  });

  test("should serialize no checked items as the empty string", () => {
    expect(serializeXltChecked(cellKey, new Set())).toBe("");
    expect(parseXltChecked("", cellKey, 5).size).toBe(0);
  });

  test("should verify only when every item is checked", () => {
    const all = serializeXltChecked(cellKey, new Set([0, 1, 2, 3, 4]));
    expect(isXltVerified(all, cellKey, 5)).toBe(true);
  });

  test("should treat the legacy bare cell key as fully verified", () => {
    expect(isXltVerified(cellKey, cellKey, 5)).toBe(true);
    expect(parseXltChecked(cellKey, cellKey, 5).size).toBe(5);
  });

  test("should ignore a value recorded for a different cell", () => {
    const other = serializeXltChecked("demand:wholesale:downtrend", new Set([0, 1]));
    expect(parseXltChecked(other, cellKey, 5).size).toBe(0);
    expect(isXltVerified(other, cellKey, 5)).toBe(false);
  });

  test("should drop out-of-range or malformed indexes", () => {
    expect([...parseXltChecked(`${cellKey}|v2:0,9,x,-1,2`, cellKey, 5)].sort()).toEqual([0, 2]);
  });

  test("should not reuse indexed checks from the older checklist version", () => {
    const old = `${cellKey}|0,1,2,3,4,5,6,7`;
    expect(parseXltChecked(old, cellKey, 5).size).toBe(0);
    expect(isXltVerified(old, cellKey, 5)).toBe(false);
  });
});
