import { describe, expect, test } from "vitest";

import type { FormState } from "@/components/trade-builder-app";
import { validateZones } from "./validate-zones";

// A valid setup: demand below, supply above. Works for either direction, since
// direction only decides which zone is the entry. Override fields per test.
const form = (overrides: Partial<FormState> = {}): FormState => ({
  accountBalance: "600",
  riskTolerance: "2",
  targetBuffer: "75",
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

  test("given demand low not below demand high: should flag demand low", () => {
    const actual = validateZones(form({ demandLow: "108" }));
    const expected = { demandLow: "Demand low must be below demand high." };
    expect(actual).toEqual(expected);
  });

  test("given supply low not below supply high: should flag supply low", () => {
    const actual = validateZones(form({ supplyLow: "126" }));
    const expected = { supplyLow: "Supply low must be below supply high." };
    expect(actual).toEqual(expected);
  });

  test("given supply overlapping the demand zone: should flag supply low", () => {
    const actual = validateZones(
      form({ supplyLow: "107", supplyHigh: "126" }),
    );
    const expected = {
      supplyLow: "The supply zone must sit above the demand zone.",
    };
    expect(actual).toEqual(expected);
  });

  test("given curve high not above curve low: should flag curve high", () => {
    const actual = validateZones(form({ curveHigh: "100" }));
    const expected = { curveHigh: "Curve high must be above curve low." };
    expect(actual).toEqual(expected);
  });

  test("given an empty field: should not flag its zone", () => {
    const actual = validateZones(form({ demandLow: "" }));
    expect(actual).toEqual({});
  });
});
