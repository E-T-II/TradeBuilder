// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { normalizeForm, type TradeLogEntry } from "@/components/trade-builder-app";
import {
  createTradeBackup,
  FORM_STORAGE_KEY,
  MAX_BACKUP_BYTES,
  parseTradeBackup,
  restoreTradeBackup,
  TRADE_LOG_STORAGE_KEY,
} from "@/lib/trade-backup";

const form = normalizeForm({
  ticker: "NVDA",
  accountBalance: "2500",
  strength: "2",
  opposingFreshness: "1",
});
const entry: TradeLogEntry = {
  id: "entry-1",
  createdAt: "2026-10-22T12:00:00.000Z",
  ticker: "NVDA",
  direction: "long",
  entry: 108,
  stop: 105.92,
  target: 120,
  positionSize: 11,
  capitalRequirement: 1188,
  totalTradeRisk: 22.88,
  rewardRisk: 5.77,
  score: 8.5,
  isOpen: false,
  exitPrice: "110",
  fees: "2",
  form: { ticker: "NVDA", strength: "2", opposingFreshness: "1" },
};

const payload = () => ({
  format: "tradebuilder-backup",
  version: 1,
  exportedAt: "2026-10-22T15:00:00.000Z",
  form: { ...form },
  tradeLog: [{ ...entry }],
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("backup validation", () => {
  test("round-trips the whole form, outcomes, and setup snapshots without modification", () => {
    const backup = parseTradeBackup(createTradeBackup(form, [entry]));
    expect(backup).toMatchObject({ format: "tradebuilder-backup", version: 1, form, tradeLog: [entry] });
    expect(Number.isFinite(Date.parse(backup.exportedAt))).toBe(true);
  });

  test("supports blank forms, empty logs, and unfinished numeric inputs", () => {
    const draft = normalizeForm({ accountBalance: ".", riskTolerance: "" });
    expect(parseTradeBackup(createTradeBackup(draft, [])).form).toEqual(draft);
    expect(parseTradeBackup(createTradeBackup(draft, [])).tradeLog).toEqual([]);
  });

  test.each([
    ["not JSON", /valid JSON/],
    ['{"format":"other"}', /not a Trade Builder backup/],
    [JSON.stringify({ ...payload(), version: 2 }), /version is not supported/],
    [JSON.stringify({ ...payload(), exportedAt: "not a date" }), /invalid form, date/],
    [JSON.stringify({ ...payload(), form: { ticker: "NVDA" } }), /invalid form, date/],
    [JSON.stringify({ ...payload(), form: { ...form, direction: "invalid" } }), /invalid form, date/],
    [JSON.stringify({ ...payload(), form: { ...form, accountBalance: 2000 } }), /invalid form, date/],
    [JSON.stringify({ ...payload(), tradeLog: {} }), /invalid form, date/],
    [JSON.stringify({ ...payload(), tradeLog: [entry, entry] }), /duplicate ID/],
    [JSON.stringify({ ...payload(), tradeLog: [entry, { ...entry, id: "bad", positionSize: "11" }] }), /Trade 2/],
    [JSON.stringify({ ...payload(), tradeLog: [{ ...entry, positionSize: 0.5 }] }), /Trade 1/],
    [JSON.stringify({ ...payload(), tradeLog: [{ ...entry, fees: "-1" }] }), /Trade 1/],
    [JSON.stringify({ ...payload(), tradeLog: [{ ...entry, exitPrice: "invalid" }] }), /Trade 1/],
    [JSON.stringify({ ...payload(), tradeLog: [{ ...entry, form: { trend: "invalid" } }] }), /Trade 1/],
    [JSON.stringify({ ...payload(), tradeLog: [{ ...entry, isOpen: "false" }] }), /Trade 1/],
  ])("rejects malformed backup without accepting partial data (%s)", (text, message) => {
    expect(() => parseTradeBackup(text)).toThrow(message);
  });

  test("rejects non-finite JSON numbers", () => {
    const text = JSON.stringify(payload()).replace('"entry":108', '"entry":1e400');
    expect(() => parseTradeBackup(text)).toThrow(/Trade 1/);
  });

  test("enforces the 10 MB limit", () => {
    expect(() => parseTradeBackup(" ".repeat(MAX_BACKUP_BYTES + 1))).toThrow(/10 MB/);
  });
});

describe("restoring browser storage", () => {
  test("replaces both datasets, including clearing an old log with an empty backup", () => {
    window.localStorage.setItem(FORM_STORAGE_KEY, "old form");
    window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, "old log");
    const backup = parseTradeBackup(createTradeBackup(form, []));
    restoreTradeBackup(window.localStorage, backup);
    expect(JSON.parse(window.localStorage.getItem(FORM_STORAGE_KEY)!)).toEqual(form);
    expect(JSON.parse(window.localStorage.getItem(TRADE_LOG_STORAGE_KEY)!)).toEqual([]);
  });

  test("leaves both datasets untouched if the first write fails", () => {
    window.localStorage.setItem(FORM_STORAGE_KEY, "old form");
    window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, "old log");
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    expect(() => restoreTradeBackup(
      window.localStorage,
      parseTradeBackup(createTradeBackup(form, [entry])),
    )).toThrow("Storage unavailable");
    expect(window.localStorage.getItem(FORM_STORAGE_KEY)).toBe("old form");
    expect(window.localStorage.getItem(TRADE_LOG_STORAGE_KEY)).toBe("old log");
  });

  test.each([null, "old form"])("rolls back the form if the log cannot be written (previous form %s)", (previous) => {
    if (previous !== null) window.localStorage.setItem(FORM_STORAGE_KEY, previous);
    window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, "old log");
    const originalSet = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === TRADE_LOG_STORAGE_KEY) throw new Error("Storage full");
      originalSet(key, value);
    });

    expect(() => restoreTradeBackup(
      window.localStorage,
      parseTradeBackup(createTradeBackup(form, [entry])),
    )).toThrow(/previous form and trade log were kept/);
    expect(window.localStorage.getItem(FORM_STORAGE_KEY)).toBe(previous);
    expect(window.localStorage.getItem(TRADE_LOG_STORAGE_KEY)).toBe("old log");
  });

  test("reports failure to recover the original form instead of claiming nothing changed", () => {
    window.localStorage.setItem(FORM_STORAGE_KEY, "old form");
    const originalSet = window.localStorage.setItem.bind(window.localStorage);
    vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
      if (key === TRADE_LOG_STORAGE_KEY || value === "old form") throw new Error("Storage unavailable");
      originalSet(key, value);
    });
    expect(() => restoreTradeBackup(
      window.localStorage,
      parseTradeBackup(createTradeBackup(form, [entry])),
    )).toThrow(/previous form could not be recovered/);
  });
});
