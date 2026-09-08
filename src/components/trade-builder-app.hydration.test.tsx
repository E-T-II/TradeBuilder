// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TradeBuilderApp } from "@/components/trade-builder-app";

const KEY = "tradebuilder-form-v3";

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
};

afterEach(() => window.localStorage.clear());

test("hydrating a saved half-point strength: snaps the rendered selection onto a valid step", async () => {
  window.localStorage.setItem(KEY, JSON.stringify(savedForm));
  const user = userEvent.setup();
  render(<TradeBuilderApp />);

  // Walk to the judged-factors step (Pre-steps -> Curve -> Trend -> Zones -> Judge).
  for (let i = 0; i < 4; i++) {
    await user.click(screen.getByRole("button", { name: /next/i }));
  }

  const strength = screen.getByRole("button", { name: "Strength" });
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
