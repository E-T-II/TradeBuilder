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
    const actual = validateZones(form());
    expect(actual).toEqual({});
  });

  test("given a valid short setup: should report no errors", () => {
    const actual = validateZones(
      form({
        direction: "short",
        entryProximal: "124",
        entryDistal: "126",
        targetProximal: "108",
        targetDistal: "106",
      }),
    );
    expect(actual).toEqual({});
  });

  test("given a long with entry distal above the proximal: should flag entry distal", () => {
    const actual = validateZones(form({ entryDistal: "110" }));
    const expected = {
      entryDistal: "For a long, entry distal should be below the proximal (108).",
    };
    expect(actual).toEqual(expected);
  });

  test("given a short with entry distal below the proximal: should flag entry distal", () => {
    const actual = validateZones(
      form({
        direction: "short",
        entryProximal: "124",
        entryDistal: "100",
        targetProximal: "108",
        targetDistal: "106",
      }),
    );
    const expected = {
      entryDistal: "For a short, entry distal should be above the proximal (124).",
    };
    expect(actual).toEqual(expected);
  });

  test("given entry distal equal to the proximal: should flag it (zero-height zone)", () => {
    const actual = validateZones(form({ entryDistal: "108" }));
    const expected = {
      entryDistal: "For a long, entry distal should be below the proximal (108).",
    };
    expect(actual).toEqual(expected);
  });

  test("given curve high not above curve low: should flag curve high", () => {
    const actual = validateZones(form({ curveHigh: "100" }));
    const expected = { curveHigh: "Curve high must be above curve low." };
    expect(actual).toEqual(expected);
  });

  test("given a long target below the entry: should flag target proximal", () => {
    const actual = validateZones(form({ targetProximal: "104" }));
    const expected = {
      targetProximal: "For a long, the target should be above the entry.",
    };
    expect(actual).toEqual(expected);
  });

  test("given a long target distal below the target proximal: should flag target distal", () => {
    const actual = validateZones(form({ targetDistal: "120" }));
    const expected = {
      targetDistal: "For a long, target distal should be above the proximal.",
    };
    expect(actual).toEqual(expected);
  });

  test("given a target so close the buffered exit flips past the entry: should flag target proximal", () => {
    const actual = validateZones(
      form({
        entryProximal: "100",
        entryDistal: "99.98",
        targetProximal: "100.10",
        targetDistal: "101",
      }),
    );
    const expected = {
      targetProximal:
        "This target zone is too close; after the buffer the exit lands on the wrong side of the entry.",
    };
    expect(actual).toEqual(expected);
  });

  test("given an empty field: should not flag its pair", () => {
    const actual = validateZones(form({ entryDistal: "" }));
    expect(actual).toEqual({});
  });
});
