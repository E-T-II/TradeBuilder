// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";

import {
  loadStoredForm,
  snapStep,
  toInputs,
  type FormState,
} from "@/components/trade-builder-app";

const KEY = "tradebuilder-form-v1";

afterEach(() => localStorage.clear());

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

describe("given toInputs and the advanced risk override", () => {
  test("given the default 2%: should pass 0.02 through", () => {
    expect(toInputs(form())?.riskTolerancePct).toBe(0.02);
  });

  test("given an advanced 5%: should pass 0.05, not clamp back to 2%", () => {
    expect(toInputs(form({ riskTolerance: "5" }))?.riskTolerancePct).toBe(0.05);
  });
});

describe("given snapStep", () => {
  test("given a half-point value on a whole-point factor: should snap to a valid step", () => {
    expect(snapStep("1.5", 1, 2)).toBe("2");
    expect(snapStep("0.4", 1, 2)).toBe("0");
  });

  test("given a value already on a valid step: should keep it", () => {
    expect(snapStep("0.5", 0.5, 1)).toBe("0.5");
  });
});

describe("given loadStoredForm", () => {
  test("given a stored form with a half-point value: should preserve the other fields", () => {
    localStorage.setItem(KEY, JSON.stringify(form({ strength: "1.5" })));
    const stored = loadStoredForm();
    expect(stored?.accountBalance).toBe("600");
    expect(stored?.entryProximal).toBe("108");
  });

  test("given a non-string field: should return null instead of crashing later", () => {
    localStorage.setItem(KEY, JSON.stringify({ accountBalance: 1 }));
    expect(loadStoredForm()).toBeNull();
  });

  test("given invalid JSON: should return null", () => {
    localStorage.setItem(KEY, "{ not json");
    expect(loadStoredForm()).toBeNull();
  });
});
