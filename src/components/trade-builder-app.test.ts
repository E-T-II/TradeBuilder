/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";

import {
  hasNonPositiveAtr,
  hasNonPositiveBalance,
  hasNonPositiveRisk,
  loadStoredForm,
  loadTradeLog,
  resultsTsv,
  snapStep,
  toInputs,
  tradeLogTsv,
  type FormState,
  type TradeLogEntry,
} from "@/components/trade-builder-app";
import { buildTrade } from "@/lib/trade-builder";

const KEY = "tradebuilder-form-v3";
const TRADE_LOG_KEY = "tradebuilder-log-v1";

// Go through window.localStorage: on Node 25 the bare `localStorage` global is
// Node's own Web Storage, which isn't backed here and shadows the jsdom one.
afterEach(() => window.localStorage.clear());

const form = (overrides: Partial<FormState> = {}): FormState => ({
  ticker: "NVDA",
  accountBalance: "600",
  riskTolerance: "2",
  targetBuffer: "75",
  targetMode: "percent",
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
  xltAcknowledgement: overrides.xltAcknowledgement ?? "",
});

describe("given toInputs and the risk cap", () => {
  test("given the default 2%: should pass 0.02 through", () => {
    expect(toInputs(form())?.riskTolerancePct).toBe(0.02);
  });

  test("given a risk above 2%: should clamp down to 2%", () => {
    expect(toInputs(form({ riskTolerance: "5" }))?.riskTolerancePct).toBe(0.02);
  });

  test("given a risk below 2%: should keep the lower value", () => {
    expect(toInputs(form({ riskTolerance: "1" }))?.riskTolerancePct).toBe(0.01);
  });
});

describe("given resultsTsv", () => {
  const result = buildTrade(toInputs(form())!);

  test("given a ticker: should include it in copied results", () => {
    const [headers, values] = resultsTsv(result, "NVDA").split("\n");

    expect(headers.split("\t")[0]).toBe("Ticker");
    expect(values.split("\t")[0]).toBe("NVDA");
  });

  test("given a blank ticker: should copy Unknown", () => {
    const [, values] = resultsTsv(result, "  ").split("\n");

    expect(values.split("\t")[0]).toBe("Unknown");
  });
});

describe("given tradeLogTsv", () => {
  const entry: TradeLogEntry = {
    id: "entry-1",
    createdAt: "2026-09-07T12:00:00.000Z",
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
    isOpen: true,
  };

  test("given a logged trade: should copy it as a header row plus a data row", () => {
    const [headers, values] = tradeLogTsv([entry]).split("\n");

    expect(headers.split("\t")).toEqual([
      "Date",
      "Ticker",
      "Direction",
      "Entry",
      "Stop",
      "Target",
      "Position size",
      "Capital required",
      "Total trade risk",
      "Reward : risk",
      "Score",
      "Status",
    ]);
    const cells = values.split("\t");
    expect(cells[1]).toBe("NVDA");
    expect(cells[2]).toBe("Buy");
    expect(cells[cells.length - 1]).toBe("Open");
  });

  test("given a closed trade: should report its status as Closed", () => {
    const [, values] = tradeLogTsv([{ ...entry, isOpen: false }]).split("\n");

    expect(values.split("\t").at(-1)).toBe("Closed");
  });

  test("given no logged trades: should copy only the header row", () => {
    expect(tradeLogTsv([])).toBe(
      "Date\tTicker\tDirection\tEntry\tStop\tTarget\tPosition size\tCapital required\tTotal trade risk\tReward : risk\tScore\tStatus",
    );
  });
});

describe("given toInputs and the target buffer band", () => {
  test("given the default 75%: should pass 0.75 through", () => {
    expect(toInputs(form())?.targetBufferPct).toBe(0.75);
  });

  test("given a buffer within 75-80%: should keep it", () => {
    expect(toInputs(form({ targetBuffer: "78" }))?.targetBufferPct).toBe(0.78);
  });

  test("given a buffer above 80%: should clamp down to 80%", () => {
    expect(toInputs(form({ targetBuffer: "90" }))?.targetBufferPct).toBe(0.8);
  });

  test("given a buffer below 75%: should clamp up to 75%", () => {
    expect(toInputs(form({ targetBuffer: "50" }))?.targetBufferPct).toBe(0.75);
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

describe("given toInputs and a non-positive ATR", () => {
  test("given an ATR of 0: should return null (no stop buffer)", () => {
    expect(toInputs(form({ atr: "0" }))).toBeNull();
  });
});

describe("given hasNonPositiveAtr", () => {
  test("given an ATR of 0: should be true", () => {
    expect(hasNonPositiveAtr(form({ atr: "0" }))).toBe(true);
  });

  test("given a positive ATR: should be false", () => {
    expect(hasNonPositiveAtr(form())).toBe(false);
  });
});

describe("given a non-positive risk (field vs engine consistency)", () => {
  test("given an explicit 0% risk: toInputs should return null, not fall back to 2%", () => {
    expect(toInputs(form({ riskTolerance: "0" }))).toBeNull();
  });

  test("given an explicit 0%: hasNonPositiveRisk should be true", () => {
    expect(hasNonPositiveRisk(form({ riskTolerance: "0" }))).toBe(true);
  });

  test("given an empty risk field: should NOT be flagged (it means use the default)", () => {
    expect(hasNonPositiveRisk(form({ riskTolerance: "" }))).toBe(false);
    expect(toInputs(form({ riskTolerance: "" }))?.riskTolerancePct).toBe(0.02);
  });

  test("given a positive risk: should be false", () => {
    expect(hasNonPositiveRisk(form({ riskTolerance: "1" }))).toBe(false);
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

  test("given an out-of-range target mode: should drop it", () => {
    // The newest enum, so the one most likely to arrive as a stale or hand-
    // edited value; a bad mode would otherwise fall through to the percent
    // branch and silently price the target a different way.
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ accountBalance: "600", targetMode: "3:1" }),
    );
    expect(loadStoredForm()).toEqual({ accountBalance: "600" });
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

describe("given loadTradeLog", () => {
  test("given a valid saved log: should return its completed trade", () => {
    const entry = {
      id: "entry-1",
      createdAt: "2026-09-07T12:00:00.000Z",
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
    };
    window.localStorage.setItem(TRADE_LOG_KEY, JSON.stringify([entry]));

    expect(loadTradeLog()).toEqual([entry]);
  });

  test("given a saved entry from before isOpen existed: should default it to open", () => {
    const legacyEntry = {
      id: "entry-1",
      createdAt: "2026-09-07T12:00:00.000Z",
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
    };
    window.localStorage.setItem(TRADE_LOG_KEY, JSON.stringify([legacyEntry]));

    expect(loadTradeLog()).toEqual([{ ...legacyEntry, isOpen: true }]);
  });

  test("given a log saved before tickers existed: should retain it as Unknown", () => {
    const legacyEntry = {
      id: "entry-1",
      createdAt: "2026-09-07T12:00:00.000Z",
      direction: "long",
      entry: 108,
      stop: 105.92,
      target: 120,
      positionSize: 11,
      capitalRequirement: 1188,
      totalTradeRisk: 22.88,
      rewardRisk: 5.77,
      score: 8.5,
    };
    window.localStorage.setItem(TRADE_LOG_KEY, JSON.stringify([legacyEntry]));

    expect(loadTradeLog()).toEqual([{ ...legacyEntry, ticker: "Unknown", isOpen: true }]);
  });

  test("given malformed saved entries: should discard them", () => {
    window.localStorage.setItem(
      TRADE_LOG_KEY,
      JSON.stringify([{ id: "missing-order-values" }, "not an entry"]),
    );

    expect(loadTradeLog()).toEqual([]);
  });
});
