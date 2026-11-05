import { describe, expect, test } from "vitest";
import { isTradeDate } from "@/lib/trade-execution";

describe("trade dates", () => {
  test.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-02", "", "invalid"])(
    "rejects invalid date %s", (date) => expect(isTradeDate(date)).toBe(false),
  );
  test("accepts leap days and date-only values", () => {
    expect(isTradeDate("2024-02-29")).toBe(true);
    expect(isTradeDate("2026-01-02")).toBe(true);
  });
});
