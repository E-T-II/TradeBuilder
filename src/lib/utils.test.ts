import { describe, expect, test } from "vitest";

import { clampNumericString } from "./utils";

describe("given clampNumericString", () => {
  test("given a value above the max: should clamp to the max", () => {
    expect(clampNumericString("5", 0, 2)).toBe("2");
    expect(clampNumericString("90", 75, 80)).toBe("80");
  });

  test("given a value below the min: should clamp to the min", () => {
    expect(clampNumericString("50", 75, 80)).toBe("75");
  });

  test("given a value in range: should leave it untouched", () => {
    expect(clampNumericString("1.5", 0, 2)).toBe("1.5");
    expect(clampNumericString("78", 75, 80)).toBe("78");
  });

  test("given an empty or non-numeric value: should leave it alone", () => {
    expect(clampNumericString("", 75, 80)).toBe("");
    expect(clampNumericString("  ", 0, 2)).toBe("  ");
  });
});
