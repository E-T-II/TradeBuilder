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
  test("given a reward:risk below the minimum: should read 'Below 3:1', not 'Over the limit'", () => {
    render(<RiskChecks result={withChecks({ meetsRewardRisk: false })} />);
    // The floor rule fails downward, so it must not borrow the ceilings' copy.
    expect(screen.getByText("Below 3:1")).toBeInTheDocument();
    expect(screen.queryByText("Over the limit")).toBeNull();
  });

  test("given open risk over the 6% ceiling: should read 'Over the limit'", () => {
    render(<RiskChecks result={withChecks({ withinMultiTradeRisk: false })} />);
    expect(screen.getByText("Over the limit")).toBeInTheDocument();
  });
});
