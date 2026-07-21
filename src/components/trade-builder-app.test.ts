// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";

import {
  hasNonPositiveBalance,
  loadStoredForm,
  snapStep,
  toInputs,
  type FormState,
} from "@/components/trade-builder-app";

const KEY = "tradebuilder-form-v3";

// Go through window.localStorage: on Node 25 the bare `localStorage` global is
// Node's own Web Storage, which isn't backed here and shadows the jsdom one.
afterEach(() => window.localStorage.clear());

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

describe("given toInputs and the advanced risk override", () => {
  test("given the default 2%: should pass 0.02 through", () => {
    expect(toInputs(form())?.riskTolerancePct).toBe(0.02);
  });

  test("given an advanced 5%: should pass 0.05, not clamp back to 2%", () => {
    expect(toInputs(form({ riskTolerance: "5" }))?.riskTolerancePct).toBe(0.05);
  });
});

describe("given toInputs and the advanced target buffer override", () => {
  test("given the default 75%: should pass 0.75 through", () => {
    expect(toInputs(form())?.targetBufferPct).toBe(0.75);
  });

  test("given an advanced 90%: should pass 0.9, not clamp back to 80%", () => {
    expect(toInputs(form({ targetBuffer: "90" }))?.targetBufferPct).toBe(0.9);
  });
});

describe("given snapStep", () => {
  test("given a half-point value on a whole-point factor: should snap to a valid step", () => {
    expect(snapStep("1.5", 1, 2)).toBe("2");
    expect(snapStep("0.4", 1, 2)).toBe("0");
  });

  test("given a value already on a valid step: should leave it unchanged", () => {
    expect(snapStep("2", 1, 2)).toBe("2");
    expect(snapStep("0.5", 0.5, 1)).toBe("0.5");
  });

  test("given an unanswered (empty) value: should leave it unanswered", () => {
    expect(snapStep("", 1, 2)).toBe("");
  });

  test("given a genuinely non-numeric value: should fall back to 0", () => {
    expect(snapStep("abc", 1, 2)).toBe("0");
  });
});

describe("given toInputs and a non-positive balance", () => {
  test("given a balance of 0: should return null rather than a trade", () => {
    expect(toInputs(form({ accountBalance: "0" }))).toBeNull();
  });
});

describe("given hasNonPositiveBalance", () => {
  test("given a balance of 0: should be true", () => {
    expect(hasNonPositiveBalance(form({ accountBalance: "0" }))).toBe(true);
  });

  test("given a positive balance: should be false", () => {
    expect(hasNonPositiveBalance(form())).toBe(false);
  });

  test("given a non-numeric balance: should be false (that's a different failure)", () => {
    expect(hasNonPositiveBalance(form({ accountBalance: "abc" }))).toBe(false);
  });
});

describe("given loadStoredForm", () => {
  test("given a payload with a non-string field: should ignore it and return null", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ accountBalance: 1 }));
    expect(loadStoredForm()).toBeNull();
  });

  test("given invalid JSON: should return null", () => {
    window.localStorage.setItem(KEY, "{ not json");
    expect(loadStoredForm()).toBeNull();
  });

  test("given an unknown key: should return null", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ hacked: "1" }));
    expect(loadStoredForm()).toBeNull();
  });

  test("given an out-of-range enum value: should return null", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ direction: "invalid" }));
    expect(loadStoredForm()).toBeNull();
  });

  test("given a well-formed string payload: should return it", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ accountBalance: "600" }));
    expect(loadStoredForm()).toEqual({ accountBalance: "600" });
  });

  test("given a mix of valid and invalid fields: should keep only the valid ones", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ accountBalance: "600", direction: "invalid", hacked: "x" }),
    );
    expect(loadStoredForm()).toEqual({ accountBalance: "600" });
  });
});
