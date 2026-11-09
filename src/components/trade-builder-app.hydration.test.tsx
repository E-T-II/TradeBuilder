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
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TradeBuilderApp, normalizeForm, toInputs } from "@/components/trade-builder-app";
import { buildTrade } from "@/lib/trade-builder";
import { createTradeBackup } from "@/lib/trade-backup";
import { LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { translate, translateText } from "@/lib/translations";

const KEY = "tradebuilder-form-v3";
const TRADE_LOG_KEY = "tradebuilder-log-v1";

// A complete, geometrically valid form so Next isn't blocked on the way to the
// judged-factors step, plus a stale half-point strength that's no longer an option.
const savedForm = {
  ticker: "NVDA",
  accountBalance: "2500",
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
  strength: "1.5",
  time: "0",
  freshness: "0",
  openTradeRisk: "0",
} as const;

afterEach(() => window.localStorage.clear());

test("My Trade Plan appears above the ticker field instead of in the header", () => {
  render(<TradeBuilderApp />);
  const button = screen.getByRole("button", { name: "Create my trade plan" });
  const ticker = screen.getByLabelText("Ticker symbol");
  expect(button.closest("header")).toBeNull();
  expect(button.compareDocumentPosition(ticker) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("language preference is available in the app header without changing the setup or resetting the preference", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  const user = userEvent.setup();
  render(<TradeBuilderApp />);
  await user.click(screen.getByRole("button", { name: "Language preference" }));
  await user.selectOptions(screen.getByRole("combobox"), "ar");
  await user.click(screen.getByRole("button", { name: translate("ar", "closeLanguage") }));
  expect(screen.getByLabelText(translateText("ar", "Ticker symbol"))).toHaveValue("NVDA");
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ar");
  await user.click(screen.getByRole("button", { name: translateText("ar", "Reset") }));
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ar");
  expect(screen.getByLabelText(translateText("ar", "Ticker symbol"))).toHaveValue("");
});

test("the education-only line links to the strategy PDF without replacing the builder", () => {
  render(<TradeBuilderApp />);

  const link = screen.getByRole("link", { name: /Engineered Risk Trading Strategy/ });
  expect(link).toHaveAttribute("href", "/engineered-risk-trading-strategy.pdf");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
  expect(link.parentElement).toHaveTextContent(
    "For education only, not financial advice. Based on the Engineered Risk Trading Strategy",
  );
});

test.each(["long", "short"] as const)("switching a %s entry swaps ratings, updates Step 4, persists, and uses the new Entry for trade outputs", async (direction) => {
  const setup = {
    ...savedForm, direction, trend: "sideways" as const,
    strength: "1", time: "0.5", freshness: "1",
    opposingStrength: "2", opposingTime: "1", opposingFreshness: "2",
  };
  window.localStorage.setItem(KEY, JSON.stringify(setup));
  const user = userEvent.setup();
  const { unmount } = render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  const switchedDirection = direction === "long" ? "short" : "long";
  const switchName = direction === "long" ? "Switch to sell short" : "Switch to buy long";
  await user.click(screen.getByRole("button", { name: switchName }));
  const entry = screen.getByRole("region", { name: "Entry zone scorecard" });
  const target = screen.getByRole("region", { name: "Target zone scorecard" });
  expect(entry).toHaveClass(switchedDirection === "long" ? "border-t-emerald-500" : "border-t-red-500");
  expect(target).toHaveClass(switchedDirection === "long" ? "border-t-red-500" : "border-t-emerald-500");
  for (const [label, entryValue, targetValue] of [
    ["Strength", "2", "1"], ["Time", "1", "0.5"], ["Freshness", "2", "1"],
  ]) {
    expect(within(entry).getByRole("button", { name: label })).toHaveTextContent(entryValue);
    expect(within(target).getByRole("button", { name: label })).toHaveTextContent(targetValue);
  }
  const switched = normalizeForm({
    ...setup, direction: switchedDirection,
    strength: "2", time: "1", freshness: "2",
    opposingStrength: "1", opposingTime: "0.5", opposingFreshness: "1",
  });
  expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject(switched);
  const expected = buildTrade(toInputs(switched)!);
  expect(expected.order).not.toBeNull();
  expect(within(entry).getByLabelText("Total odds-enhancer score")).toHaveTextContent(String(expected.scorecard.total));
  expect(within(entry).getByLabelText("Trend score")).toHaveTextContent(String(expected.scorecard.trend));
  expect(within(entry).getByLabelText("Curve score")).toHaveTextContent(String(expected.scorecard.curve));
  expect(within(entry).getByLabelText("Profit zone score")).toHaveTextContent(String(expected.scorecard.profitZone));

  await user.click(screen.getByRole("button", { name: /^back$/i }));
  expect(screen.getByRole("radio", { name: switchedDirection === "long" ? "Buy long" : "Sell short" })).toBeChecked();
  expect(screen.queryByRole("button", { name: /switch to/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  expect(screen.queryByRole("button", { name: "Copy results" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Log trade" }));
  const logged = JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)[0];
  expect(logged).toMatchObject({
    direction: switchedDirection, score: expected.scorecard.total,
    entry: expected.order!.entry, stop: expected.order!.stop, target: expected.order!.target,
    form: switched,
  });
  unmount();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  expect(screen.getByRole("region", { name: "Entry zone scorecard" })).toHaveClass(
    switchedDirection === "long" ? "border-t-emerald-500" : "border-t-red-500",
  );
  await user.click(screen.getByRole("button", { name: /switch to/i }));
  expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject(setup);
});

test("opposing-zone ratings persist without changing the original scorecard, order, printed log, or logged trade", async () => {
  const setup = { ...savedForm, strength: "2", time: "1", freshness: "2" };
  window.localStorage.setItem(KEY, JSON.stringify(setup));
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const expected = buildTrade(toInputs(normalizeForm(setup))!);
  expect(expected.order).not.toBeNull();
  const { unmount } = render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }
  const original = screen.getByRole("region", { name: "Entry zone scorecard" });
  const opposing = screen.getByRole("region", { name: "Target zone scorecard" });
  expect(original.compareDocumentPosition(opposing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(opposing).getByLabelText("Total odds-enhancer score")).toHaveTextContent("-");

  for (const [factor, choice] of [
    ["Strength", "Good strength, 1 points"],
    ["Time", "Good time, 0.5 points"],
    ["Freshness", "Poor freshness, 0 points"],
  ]) {
    await user.click(within(opposing).getByRole("button", { name: factor }));
    await user.click(within(opposing).getByRole("button", { name: choice }));
  }
  expect(within(original).getByRole("button", { name: "Strength" })).toHaveTextContent("2");
  expect(within(original).getByRole("button", { name: "Time" })).toHaveTextContent("1");
  expect(within(original).getByRole("button", { name: "Freshness" })).toHaveTextContent("2");
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  expect(screen.queryByRole("region", { name: "Target zone scorecard" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copy results" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Log trade" }));
  const logged = JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)[0];
  expect(logged.score).toBe(expected.scorecard.total);
  expect(logged.entry).toBe(expected.order!.entry);
  expect(screen.queryByRole("button", { name: "Copy log" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
  expect(print).toHaveBeenCalledOnce();
  expect(document.body.dataset.printReport).toBe("trade-log");
  expect(screen.getByRole("article", { name: "Printable trade log" })).toHaveTextContent(
    `O.E. Score ${expected.scorecard.total} / 10`,
  );
  fireEvent(window, new Event("afterprint"));
  print.mockRestore();
  expect(logged.form).toMatchObject({
    strength: "2", time: "1", freshness: "2",
    opposingStrength: "1", opposingTime: "0.5", opposingFreshness: "0",
  });
  expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject(logged.form);

  unmount();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }
  const restored = screen.getByRole("region", { name: "Target zone scorecard" });
  expect(within(restored).getByRole("button", { name: "Time" })).toHaveTextContent("0.5");
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(JSON.parse(window.localStorage.getItem(KEY)!)).toMatchObject({
    opposingStrength: "", opposingTime: "", opposingFreshness: "",
  });
});

test("hydrating a saved half-point strength: snaps the rendered selection onto a valid step", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  // Walk to the judged-factors step (Pre-steps -> Curve -> Trend -> Zones -> Judge).
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }

  const strength = within(screen.getByRole("region", { name: "Entry zone scorecard" })).getByRole("button", { name: "Strength" });
  // 1.5 snaps up to 2; the current graphic selector displays that score.
  expect(strength).toHaveTextContent("2");
});

test("hydrating saved risk/buffer beyond the caps: normalizes the fields to the limits", async () => {
  // A pre-cap save could hold 5% risk / 90% buffer; on load the fields must
  // show the clamped values so they can't disagree with the order math.
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...savedForm, riskTolerance: "5", targetBuffer: "90" }),
  );
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  await user.click(screen.getByRole("button", { name: /advanced settings/i }));

  expect(screen.getByLabelText("Risk per trade (%)")).toHaveValue(2);
  expect(screen.getByLabelText("Target buffer (%)")).toHaveValue(80);
});

test("hydrating a save from before target modes existed: defaults to the percentage mode", async () => {
  // The universal upgrade path — every existing save predates the field, so
  // this is what users actually hit on their first load after the release.
  const { targetMode, ...beforeTargetModes } = savedForm;
  expect(targetMode).toBeDefined(); // guard: the omission below has to be real
  window.localStorage.setItem(KEY, JSON.stringify(beforeTargetModes));
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  await user.click(screen.getByRole("button", { name: /advanced settings/i }));

  const group = screen.getByRole("radiogroup", { name: "Target mode" });
  expect(within(group).getByRole("radio", { name: "Percentage" })).toBeChecked();
});

test("loading a logged setup: repopulates the builder with that entry's inputs", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  window.localStorage.setItem(
    TRADE_LOG_KEY,
    JSON.stringify([
      {
        id: "entry-1",
        createdAt: "2026-09-07T12:00:00.000Z",
        ticker: "AAPL",
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
        form: { ...savedForm, ticker: "AAPL" },
      },
    ]),
  );
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));

  expect(screen.getByRole("button", { name: /O\.E\. Score 8\.5 \/ 10 \| Reward:Risk 5\.77:1/ })).toBeInTheDocument();
  expect(screen.queryByText("Click to edit trade details and notes")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Load AAPL setup into builder" }));

  expect(screen.getByLabelText("Ticker symbol")).toHaveValue("AAPL");
});

test("loading a pre-existing (pre-snapshot) logged trade: still populates its ticker and direction", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  window.localStorage.setItem(
    TRADE_LOG_KEY,
    JSON.stringify([
      {
        id: "entry-1",
        createdAt: "2026-09-07T12:00:00.000Z",
        ticker: "MSFT",
        direction: "short",
        entry: 108,
        stop: 105.92,
        target: 120,
        positionSize: 11,
        capitalRequirement: 1188,
        totalTradeRisk: 22.88,
        rewardRisk: 5.77,
        score: 8.5,
        isOpen: true,
        // no `form` field: a save from before the snapshot feature existed
      },
    ]),
  );
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));

  await user.click(screen.getByRole("button", { name: "Load MSFT setup into builder" }));

  expect(screen.getByLabelText("Ticker symbol")).toHaveValue("MSFT");
});

test("recording a closed trade outcome: updates performance and persists the closing details", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  window.localStorage.setItem(
    TRADE_LOG_KEY,
    JSON.stringify([
      {
        id: "entry-1",
        createdAt: "2026-09-07T12:00:00.000Z",
        ticker: "NVDA",
        direction: "long",
        entry: 108,
        stop: 106,
        target: 120,
        positionSize: 10,
        capitalRequirement: 1080,
        totalTradeRisk: 20,
        rewardRisk: 6,
        score: 8.5,
        isOpen: true,
        form: { ...savedForm },
      },
    ]),
  );
  const user = userEvent.setup();
  const { unmount } = render(<TradeBuilderApp />);

  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("radio", { name: "Closed" }));
  await user.click(screen.getByRole("button", { name: /NVDA \| Buy 10 shares/ }));
  await user.type(screen.getByRole("spinbutton", { name: "Profit/Loss for NVDA" }), "17.25");
  fireEvent.change(screen.getByLabelText("Closing date for NVDA"), { target: { value: "2026-09-08" } });
  expect(screen.getByText("Advanced details").closest("details")).not.toHaveAttribute("open");
  await user.click(screen.getByText("Advanced details"));
  await user.type(screen.getByRole("spinbutton", { name: "Exit price for NVDA" }), "110");
  await user.type(screen.getByRole("spinbutton", { name: "Fees for NVDA" }), "2");
  await user.type(screen.getByLabelText("Actual opening price ($) for NVDA"), "108.5");
  await user.type(screen.getByLabelText("Actual shares for NVDA"), "10");
  fireEvent.change(screen.getByLabelText("Actual opening date for NVDA"), { target: { value: "2026-09-07" } });
  await user.type(screen.getByLabelText("Notes for NVDA"), "Waited for confirmation");

  expect(screen.getByText("Completed trades")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Tax supporting report" })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Closing year")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Print trade log/ })).not.toBeInTheDocument();
  expect(within(screen.getByRole("dialog", { name: "NVDA trade details" })).getByText("+$17.25")).toBeInTheDocument();
  expect(screen.queryByText(/Average R|Actual R/)).not.toBeInTheDocument();
  expect(screen.queryByRole("columnheader", { name: "Setup" })).not.toBeInTheDocument();
  expect(screen.queryByText("Proximal · Uptrend · 8.5–10")).not.toBeInTheDocument();
  expect(screen.getByText("Ave P&L ratio").nextElementSibling).toHaveTextContent("No losing trades yet");
  expect(JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)[0]).toMatchObject({
    isOpen: false,
    exitPrice: "110",
    fees: "2",
    profitLoss: "17.25",
    actualEntryPrice: "108.5",
    actualQuantity: "10",
    openedOn: "2026-09-07",
    closedOn: "2026-09-08",
    notes: "Waited for confirmation",
  });

  await user.click(screen.getByRole("button", { name: "Close NVDA trade details" }));
  expect(screen.getByRole("button", { name: /NVDA \| Buy 10 shares/ })).toHaveTextContent("Profit/Loss +$17.25");
  expect(within(screen.getByRole("region", { name: "Realized performance" })).getByText("+$17.25")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "P&L Analysis" }));
  fireEvent.change(screen.getByLabelText("Calendar month"), { target: { value: "2026-09" } });
  expect(screen.getByRole("cell", { name: "2026-09-08: +$17.25, 1 trade" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close P&L Analysis" }));
  await user.click(screen.getByRole("button", { name: /NVDA \| Buy 10 shares/ }));
  expect(screen.getByRole("button", { name: "Close NVDA trade details" })).toBeVisible();
  expect(screen.getByRole("spinbutton", { name: "Profit/Loss for NVDA" })).toHaveValue(17.25);
  expect(screen.getByLabelText("Closing date for NVDA")).toHaveValue("2026-09-08");
  expect(screen.getByText("Advanced details").closest("details")).not.toHaveAttribute("open");

  unmount();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("button", { name: /NVDA \| Buy 10 shares/ }));
  expect(screen.getByRole("spinbutton", { name: "Profit/Loss for NVDA" })).toHaveValue(17.25);
  expect(screen.getByLabelText("Closing date for NVDA")).toHaveValue("2026-09-08");
  expect(screen.getByText("Advanced details").closest("details")).not.toHaveAttribute("open");
  await user.click(screen.getByText("Advanced details"));
  expect(screen.getByRole("spinbutton", { name: "Exit price for NVDA" })).toHaveValue(110);
  expect(screen.getByRole("spinbutton", { name: "Fees for NVDA" })).toHaveValue(2);
  expect(screen.getByLabelText("Actual opening price ($) for NVDA")).toHaveValue(108.5);
  expect(screen.getByLabelText("Actual shares for NVDA")).toHaveValue(10);
  expect(screen.getByLabelText("Actual opening date for NVDA")).toHaveValue("2026-09-07");
  expect(screen.getByLabelText("Notes for NVDA")).toHaveValue("Waited for confirmation");
});

test("shows the average winning trade against the average losing trade", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  // Wins: +$40 and +$20 (average $30). Losses: -$10 and -$5 (average $7.50). Ratio 4:1.
  window.localStorage.setItem(
    TRADE_LOG_KEY,
    JSON.stringify([
      {
        id: "entry-1", createdAt: "2026-09-01T12:00:00.000Z", ticker: "NVDA", direction: "long",
        entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
        totalTradeRisk: 20, rewardRisk: 6, score: 8.5, isOpen: false, exitPrice: "112", fees: "0",
        form: { ...savedForm },
      },
      {
        id: "entry-2", createdAt: "2026-09-02T12:00:00.000Z", ticker: "NVDA", direction: "long",
        entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
        totalTradeRisk: 20, rewardRisk: 6, score: 8.5, isOpen: false, exitPrice: "110", fees: "0",
        form: { ...savedForm },
      },
      {
        id: "entry-3", createdAt: "2026-09-03T12:00:00.000Z", ticker: "NVDA", direction: "long",
        entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
        totalTradeRisk: 20, rewardRisk: 6, score: 8.5, isOpen: false, exitPrice: "107", fees: "0",
        form: { ...savedForm },
      },
      {
        id: "entry-4", createdAt: "2026-09-04T12:00:00.000Z", ticker: "NVDA", direction: "long",
        entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
        totalTradeRisk: 20, rewardRisk: 6, score: 8.5, isOpen: false, exitPrice: "107.5", fees: "0",
        form: { ...savedForm },
      },
    ]),
  );
  const user = userEvent.setup();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));

  expect(screen.getByText("Ave P&L ratio").nextElementSibling).toHaveTextContent("4.00:1");
  expect(screen.getAllByRole("button", { name: /NVDA \| Buy 10 shares/ }).map((button) => button.textContent))
    .toEqual(expect.arrayContaining([
      expect.stringContaining("Profit/Loss +$40.00"),
      expect.stringContaining("Profit/Loss +$20.00"),
      expect.stringContaining("Profit/Loss -$10.00"),
      expect.stringContaining("Profit/Loss -$5.00"),
    ]));
  expect(screen.queryByText("Click to edit trade details and notes")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /NVDA \| Buy 10 shares/ })).toHaveLength(4);
});

test("execution changes report storage failures and preserve the previous saved log", async () => {
  const entry = {
    id: "save-test", createdAt: "2026-09-07T12:00:00.000Z", ticker: "NVDA", direction: "long",
    entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
    totalTradeRisk: 20, rewardRisk: 6, score: 9, isOpen: false, exitPrice: "110", fees: "2",
    form: { ...savedForm },
  };
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  window.localStorage.setItem(TRADE_LOG_KEY, JSON.stringify([entry]));
  const user = userEvent.setup();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("button", { name: /NVDA \| Buy 10 shares/ }));
  await user.click(screen.getByText("Advanced details"));
  const originalSet = window.localStorage.setItem.bind(window.localStorage);
  const setItem = vi.spyOn(window.localStorage, "setItem").mockImplementation((key, value) => {
    if (key === TRADE_LOG_KEY) throw new Error("Storage full");
    originalSet(key, value);
  });
  try {
    fireEvent.change(screen.getByLabelText("Actual shares for NVDA"), { target: { value: "12" } });
    expect(screen.getByText(/Trade log changes could not be saved/)).toBeInTheDocument();
    expect(screen.getByLabelText("Actual shares for NVDA")).toHaveValue(null);
    expect(JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)).toEqual([entry]);
  } finally {
    setItem.mockRestore();
  }
  fireEvent.change(screen.getByLabelText("Actual shares for NVDA"), { target: { value: "12" } });
  expect(screen.queryByText(/Trade log changes could not be saved/)).not.toBeInTheDocument();
  expect(JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)[0].actualQuantity).toBe("12");
});

test("restoring a backup replaces the form and log, preserves imported risk, and survives reload", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  const user = userEvent.setup();
  const restoredForm = normalizeForm({
    ...savedForm,
    ticker: "AAPL",
    accountBalance: "4000",
    openTradeRisk: "12.00",
  });
  const restoredLog = [{
    id: "restored-trade",
    createdAt: "2026-10-22T12:00:00.000Z",
    ticker: "AAPL",
    direction: "long" as const,
    entry: 108,
    stop: 106,
    target: 120,
    positionSize: 10,
    capitalRequirement: 1080,
    totalTradeRisk: 20,
    rewardRisk: 6,
    score: 8.5,
    isOpen: false,
    exitPrice: "110",
    fees: "2",
    form: restoredForm,
  }];
  const text = createTradeBackup(restoredForm, restoredLog);
  const file = new File([text], "backup.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => text });
  window.localStorage.setItem(
    TRADE_LOG_KEY,
    JSON.stringify([{ ...restoredLog[0], id: "previous-trade", ticker: "NVDA" }]),
  );
  const { unmount } = render(<TradeBuilderApp />);
  await user.click(screen.getByRole("button", { name: /advanced settings/i }));
  await user.click(screen.getByRole("checkbox", { name: /Auto-fill open trade risk/ }));
  await user.click(screen.getByRole("button", { name: "Backup and restore" }));
  await user.upload(screen.getByLabelText(/Choose a backup file/), file);
  await screen.findByText("Backup preview");
  await user.click(screen.getByRole("checkbox", { name: /I understand/ }));
  await user.click(screen.getByRole("button", { name: "Replace data and restore" }));
  expect(screen.getByRole("status")).toHaveTextContent("Backup restored");
  await user.click(screen.getByRole("button", { name: "Close backup dialog" }));
  expect(screen.getByLabelText("Ticker symbol")).toHaveValue("AAPL");
  expect(screen.getByLabelText("Risk in open trades ($)")).toHaveValue("12.00");
  expect(screen.getByRole("checkbox", { name: /Auto-fill open trade risk/ })).not.toBeChecked();
  expect(JSON.parse(window.localStorage.getItem(KEY)!)).toEqual(restoredForm);
  expect(JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)).toEqual(restoredLog);
  unmount();
  render(<TradeBuilderApp />);
  expect(screen.getByLabelText("Ticker symbol")).toHaveValue("AAPL");
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /^next$/i }));
  }
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("button", { name: /AAPL \| Buy 10 shares/ }));
  expect(screen.getByRole("spinbutton", { name: "Exit price for AAPL" })).toHaveValue(110);
  expect(screen.getByRole("spinbutton", { name: "Fees for AAPL" })).toHaveValue(2);
});
