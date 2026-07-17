// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";

import { loadStoredForm, snapStep } from "@/components/trade-builder-app";

const KEY = "tradebuilder-form-v2";

afterEach(() => localStorage.clear());

describe("given snapStep", () => {
  test("given a half-point value on a whole-point factor: should snap to a valid step", () => {
    expect(snapStep("1.5", 1, 2)).toBe("2");
    expect(snapStep("0.4", 1, 2)).toBe("0");
  });

  test("given a value already on a valid step: should leave it unchanged", () => {
    expect(snapStep("2", 1, 2)).toBe("2");
    expect(snapStep("0.5", 0.5, 1)).toBe("0.5");
  });

  test("given a non-numeric value: should fall back to 0", () => {
    expect(snapStep("", 1, 2)).toBe("0");
  });
});

describe("given loadStoredForm", () => {
  test("given a payload with a non-string field: should ignore it and return null", () => {
    localStorage.setItem(KEY, JSON.stringify({ accountBalance: 1 }));
    expect(loadStoredForm()).toBeNull();
  });

  test("given invalid JSON: should return null", () => {
    localStorage.setItem(KEY, "{ not json");
    expect(loadStoredForm()).toBeNull();
  });

  test("given a well-formed string payload: should return it", () => {
    localStorage.setItem(KEY, JSON.stringify({ accountBalance: "600" }));
    expect(loadStoredForm()).toEqual({ accountBalance: "600" });
  });
});
