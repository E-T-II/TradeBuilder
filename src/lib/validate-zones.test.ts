import { describe, expect, test } from "vitest";

import type { FormState } from "@/components/trade-builder-app";
import { validateZones } from "./validate-zones";

// A valid long setup; override fields per test.
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
  entryProximal: "108",
  entryDistal: "106",
  targetProximal: "124",
  targetDistal: "126",
  strength: "1",
  time: "0.5",
  freshness: "1",
  openTradeRisk: "0",
  ...overrides,
});

describe("given the zone validator", () => {
  test("given a valid long setup: should report no errors", () => {
    expect(validateZones(form())).toEqual({});
  });

  test("given a valid short setup: should report no errors", () => {
    const short = form({
      direction: "short",
      entryProximal: "124",
      entryDistal: "126",
      targetProximal: "108",
      targetDistal: "106",
    });
    expect(validateZones(short)).toEqual({});
  });

  test("given a long with entry distal above the proximal: should flag entry distal", () => {
    expect(validateZones(form({ entryDistal: "110" })).entryDistal).toBeDefined();
  });

  test("given a short with entry distal below the proximal: should flag entry distal", () => {
    const short = form({
      direction: "short",
      entryProximal: "124",
      entryDistal: "100",
      targetProximal: "108",
      targetDistal: "106",
    });
    expect(validateZones(short).entryDistal).toBeDefined();
  });

  test("given entry distal equal to the proximal: should flag it (zero-height zone)", () => {
    expect(validateZones(form({ entryDistal: "108" })).entryDistal).toBeDefined();
  });

  test("given curve high not above curve low: should flag curve high", () => {
    expect(validateZones(form({ curveHigh: "100" })).curveHigh).toBeDefined();
  });

  test("given a long target below the entry: should flag target proximal", () => {
    expect(validateZones(form({ targetProximal: "104" })).targetProximal).toBeDefined();
  });

  test("given a long target distal below the target proximal: should flag target distal", () => {
    expect(validateZones(form({ targetDistal: "120" })).targetDistal).toBeDefined();
  });

  test("given an empty field: should not flag its pair", () => {
    expect(validateZones(form({ entryDistal: "" })).entryDistal).toBeUndefined();
  });
});
