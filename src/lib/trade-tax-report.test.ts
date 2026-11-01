import { describe, expect, test } from "vitest";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { buildTaxReport, isTradeDate, taxTradeRecord } from "@/lib/trade-tax-report";

const entry: TradeLogEntry = {
  id: "one", createdAt: "2025-01-01T00:00:00Z", ticker: "TEST", direction: "long",
  entry: 10, stop: 9, target: 20, positionSize: 100, capitalRequirement: 1000,
  totalTradeRisk: 100, rewardRisk: 10, score: 9, isOpen: false,
  openedOn: "2025-12-30", closedOn: "2026-01-02", actualEntryPrice: "12.5",
  actualQuantity: "2.5", exitPrice: "15", fees: "1",
};

describe("tax supporting records", () => {
  test.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-02", "", "invalid"])(
    "rejects invalid date %s", (date) => expect(isTradeDate(date)).toBe(false),
  );
  test("accepts leap days and date-only values", () => {
    expect(isTradeDate("2024-02-29")).toBe(true);
    expect(isTradeDate("2026-01-02")).toBe(true);
  });
  test("uses actual prices and fractional quantity rather than the planned order", () => {
    expect(taxTradeRecord(entry).row).toMatchObject({
      quantity: 2.5, grossProceeds: 37.5, purchaseCost: 31.25, fees: 1, netPnl: 5.25,
    });
  });
  test("uses opening sale proceeds and closing purchase cost for shorts", () => {
    expect(taxTradeRecord({ ...entry, direction: "short", actualEntryPrice: "20" }).row)
      .toMatchObject({ grossProceeds: 50, purchaseCost: 37.5, netPnl: 11.5 });
  });
  test("does not substitute planned values for missing execution data", () => {
    const record = taxTradeRecord({ ...entry, actualEntryPrice: "", actualQuantity: undefined });
    expect(record.row).toBeNull();
    expect(record.issues).toHaveLength(2);
  });
  test.each([
    { openedOn: "2026-01-03" }, { actualEntryPrice: "-1" }, { actualQuantity: "0" },
    { exitPrice: "" }, { fees: "-1" }, { actualQuantity: "1e308", actualEntryPrice: "1e308" },
  ])("blocks invalid execution data %j", (patch) => {
    expect(taxTradeRecord({ ...entry, ...patch }).row).toBeNull();
    expect(taxTradeRecord({ ...entry, ...patch }).issues.length).toBeGreaterThan(0);
  });
  test("blank fees mean zero and breakeven is preserved", () => {
    expect(taxTradeRecord({ ...entry, fees: "", exitPrice: "12.5" }).row)
      .toMatchObject({ fees: 0, netPnl: 0 });
  });
  test("filters by actual closing year, excludes opens, sorts and totals closed records", () => {
    const report = buildTaxReport([
      entry,
      { ...entry, id: "open", isOpen: true },
      { ...entry, id: "old", closedOn: "2025-12-31" },
      { ...entry, id: "two", closedOn: "2026-01-01", exitPrice: "10" },
    ], "2026");
    expect(report.rows.map((row) => row.id)).toEqual(["two", "one"]);
    expect(report).toMatchObject({
      openCount: 1, otherYearCount: 1, problems: [],
      totals: { grossProceeds: 62.5, purchaseCost: 62.5, fees: 2, netPnl: -2 },
    });
  });
  test("flags undated closed records regardless of the selected year", () => {
    expect(buildTaxReport([{ ...entry, closedOn: undefined }], "2027").problems).toHaveLength(1);
  });
});
