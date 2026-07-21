// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TradeBuilderApp } from "@/components/trade-builder-app";

const KEY = "tradebuilder-form-v3";

// A complete, geometrically valid form so Next isn't blocked on the way to the
// judged-factors step, plus a stale half-point strength that's no longer an option.
const savedForm = {
  accountBalance: "2500",
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

  const strength = screen.getByRole("radiogroup", { name: "Strength" });
  // 1.5 snaps up to 2; that chip is selected and no half-point chip exists.
  expect(within(strength).getByRole("radio", { name: "2" })).toBeChecked();
  expect(within(strength).queryByRole("radio", { name: "1.5" })).toBeNull();
});
