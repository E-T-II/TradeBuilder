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

import type { FormState } from "@/components/trade-builder-app";
import { validateZones } from "./validate-zones";

// A valid setup: demand below, supply above. Works for either direction, since
// direction only decides which zone is the entry. Override fields per test.
const form = (overrides: Partial<FormState> = {}): FormState => ({
  ticker: "NVDA",
  accountBalance: "600",
  riskTolerance: "2",
  targetBuffer: "75",
  targetMode: "percent",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: "4",
  curveLow: "100",
  curveHigh: "130",
  demandHigh: "108",
  demandLow: "106",
  supplyHigh: "126",
  supplyLow: "124",
  strength: "1",
  time: "0.5",
  freshness: "1",
  openTradeRisk: "0",
  ...overrides,
  xltAcknowledgement: overrides.xltAcknowledgement ?? "",
});

describe("validateZones()", () => {
  test("given a valid long setup: should report no errors", () => {
    const actual = validateZones(form());
    expect(actual).toEqual({});
  });

  test("given the same zones read as a short: should report no errors", () => {
    const actual = validateZones(form({ direction: "short" }));
    expect(actual).toEqual({});
  });

  test("given demand distal not below demand proximal: should flag demand distal", () => {
    const actual = validateZones(form({ demandLow: "108" }));
    const expected = {
      demandLow: "Demand distal must be below demand proximal.",
    };
    expect(actual).toEqual(expected);
  });

  test("given supply proximal not below supply distal: should flag supply proximal", () => {
    const actual = validateZones(form({ supplyLow: "126" }));
    const expected = {
      supplyLow: "Supply proximal must be below supply distal.",
    };
    expect(actual).toEqual(expected);
  });

  test("given supply overlapping the demand zone: should flag demand proximal", () => {
    // Supply is entered first now, so a valid supply zone left as-is and a
    // demand proximal typed high enough to overlap it should flag the field
    // being edited (demand proximal), not the supply line already left behind.
    const actual = validateZones(form({ demandHigh: "125" }));
    const expected = {
      demandHigh: "The supply zone must sit above the demand zone.",
    };
    expect(actual).toEqual(expected);
  });

  test("given curve high not above curve low: should flag curve low", () => {
    // Curve high is the first field of the pair, so the error belongs on the
    // second one — the field still being edited, not the one already left.
    const actual = validateZones(form({ curveHigh: "100" }));
    const expected = { curveLow: "Curve low must be below curve high." };
    expect(actual).toEqual(expected);
  });

  test("given a demand zone below the curve low: should flag demand low", () => {
    const actual = validateZones(form({ demandLow: "99" }));
    const expected = {
      demandLow: "The demand zone can't sit below the curve low.",
    };
    expect(actual).toEqual(expected);
  });

  test("given a supply zone above the curve high: should flag supply high", () => {
    const actual = validateZones(form({ supplyHigh: "131" }));
    const expected = {
      supplyHigh: "The supply zone can't sit above the curve high.",
    };
    expect(actual).toEqual(expected);
  });

  test("given a demand high above the curve high: should flag demand high directly, not just the supply", () => {
    // Supply pushed above demand too, so the overlap check (also on demand
    // high now) doesn't pre-empt this curve-height check on the same field.
    const actual = validateZones(
      form({ demandHigh: "131", supplyLow: "135", supplyHigh: "137" }),
    );
    expect(actual.demandHigh).toBe(
      "The demand zone can't sit above the curve high.",
    );
  });

  test("given a supply low below the curve low: should flag supply low directly", () => {
    // Whole structure below the curve floor so the "above demand" check doesn't
    // pre-empt the supply-low field.
    const actual = validateZones(
      form({ demandLow: "90", demandHigh: "92", supplyLow: "95" }),
    );
    expect(actual.supplyLow).toBe(
      "The supply zone can't sit below the curve low.",
    );
  });

  test("given an empty field: should not flag its zone", () => {
    const actual = validateZones(form({ demandLow: "" }));
    expect(actual).toEqual({});
  });
});
