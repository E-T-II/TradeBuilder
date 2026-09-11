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
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { buildTrade, type TradeInputs, type TradeResult } from "@/lib/trade-builder";
import { RiskChecks } from "@/components/risk-checks";

// A valid long trade so every check passes by default; override per case.
const longTrade: TradeInputs = {
  accountBalance: 2500,
  riskTolerancePct: 0.02,
  targetBufferPct: 0.75,
  targetMode: "percent",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: 4,
  curveLow: 100,
  curveHigh: 130,
  entryProximal: 108,
  entryDistal: 106,
  targetProximal: 124,
  targetDistal: 126,
  strength: 1,
  time: 0.5,
  freshness: 1,
};

const base = buildTrade(longTrade);

function withChecks(
  overrides: Partial<NonNullable<TradeResult["checks"]>>,
): TradeResult {
  return { ...base, checks: { ...base.checks!, ...overrides } };
}

describe("given RiskChecks", () => {
  // The 3:1 rule is a hard gate, so the engine can't emit a failing
  // meetsRewardRisk on an order — this pins the copy contract for the row,
  // which is still the only place a floor rule's failure is worded.
  test("given a reward:risk below the minimum: should read 'Below 3:1', not 'Over the limit'", () => {
    render(<RiskChecks result={withChecks({ meetsRewardRisk: false })} />);
    // The floor rule fails downward, so it must not borrow the ceilings' copy.
    expect(screen.getByText("Below 3:1")).toBeInTheDocument();
    expect(screen.queryByText("Over the limit")).toBeNull();
  });

  test("given a real over-6pct rejection: should still show the card with the failing row", () => {
    // The 6% rejection carries its checks precisely so this card can quantify
    // the miss the order ticket names; it is the one engine-emitted failure.
    const rejected = buildTrade({
      ...longTrade,
      accountBalance: 600,
      atr: 1,
      curveLow: 12,
      curveHigh: 18,
      entryProximal: 13.24,
      entryDistal: 13,
      targetProximal: 15,
      targetDistal: 15.5,
      openTradeRisk: 30,
    });
    expect(rejected.blockedReason).toBe("over-6pct");
    render(<RiskChecks result={rejected} />);
    expect(screen.getByText(/Open risk within \$36.00/)).toBeInTheDocument();
    expect(screen.getByText("Over the limit")).toBeInTheDocument();
  });
});
