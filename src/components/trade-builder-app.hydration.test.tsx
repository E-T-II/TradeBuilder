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
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TradeBuilderApp, normalizeForm, resultsTsv, toInputs } from "@/components/trade-builder-app";
import { buildTrade } from "@/lib/trade-builder";

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

test.each(["long", "short"] as const)("switching a %s entry swaps ratings, updates Step 4, persists, and uses the new Entry for trade outputs", async (direction) => {
  const setup = {
    ...savedForm, direction, trend: "sideways" as const,
    strength: "1", time: "0.5", freshness: "1",
    opposingStrength: "2", opposingTime: "1", opposingFreshness: "2",
  };
  window.localStorage.setItem(KEY, JSON.stringify(setup));
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
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
  await user.click(screen.getByRole("button", { name: "Copy results" }));
  expect(writeText).toHaveBeenCalledWith(resultsTsv(expected, setup.ticker));
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
  writeText.mockRestore();
});

test("opposing-zone ratings persist without changing the original scorecard, order, exports, or logged trade", async () => {
  const setup = { ...savedForm, strength: "2", time: "1", freshness: "2" };
  window.localStorage.setItem(KEY, JSON.stringify(setup));
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
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
  await user.click(screen.getByRole("button", { name: "Copy results" }));
  expect(writeText).toHaveBeenCalledWith(resultsTsv(expected, setup.ticker));
  await user.click(screen.getByRole("button", { name: "Log trade" }));
  const logged = JSON.parse(window.localStorage.getItem(TRADE_LOG_KEY)!)[0];
  expect(logged.score).toBe(expected.scorecard.total);
  expect(logged.entry).toBe(expected.order!.entry);
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
  writeText.mockRestore();
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
