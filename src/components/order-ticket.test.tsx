// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { buildTrade, type TradeInputs } from "@/lib/trade-builder";
import { OrderTicket } from "@/components/order-ticket";

// A valid long confirmation setup; override per case.
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

describe("given OrderTicket", () => {
  test("given a valid setup: should show the order", () => {
    const result = buildTrade(longTrade);
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/buy .* shares/i)).toBeInTheDocument();
  });

  test("given a score below 7: should say the setup doesn't qualify", () => {
    // A sideways trend drops this setup to 6.5, a no-trade score.
    const result = buildTrade({ ...longTrade, trend: "sideways" });
    expect(result.entryType).toBe("no-trade");
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/the score is below 7/i)).toBeInTheDocument();
  });

  test("given a reward:risk below 3:1: should say the strategy rejects it", () => {
    const result = buildTrade({
      ...longTrade,
      strength: 2,
      time: 1,
      freshness: 2,
      entryProximal: 108,
      entryDistal: 106,
      targetProximal: 114,
      targetDistal: 116,
    });
    expect(result.blockedReason).toBe("reward-risk");
    render(<OrderTicket result={result} direction="long" />);
    // "You need a farther target" is unactionable without the shortfall: 2.9
    // and 1.2 are very different problems, so the copy states what it reaches.
    expect(screen.getByText(/only reaches 2.16:1/i)).toBeInTheDocument();
    expect(screen.getByText(/3:1 minimum/i)).toBeInTheDocument();
  });

  test("given a mechanical target past the opposing zone: should say 3:1 isn't reachable before it", () => {
    // Nothing is short of 3:1 here — the ratio target simply lands outside the
    // profit zone — so the copy must not quote a ratio it never computed.
    const result = buildTrade({
      ...longTrade,
      targetMode: "ratio",
      strength: 2,
      time: 1,
      freshness: 2,
      entryDistal: 107.5,
      targetProximal: 109.74,
      targetDistal: 111,
    });
    expect(result.blockedReason).toBe("reward-risk");
    expect(result.rewardRisk).toBeUndefined();
    render(<OrderTicket result={result} direction="long" />);
    expect(
      screen.getByText(/can't reach a 3:1 reward-to-risk before the opposing zone/i),
    ).toBeInTheDocument();
  });

  test("given open risk over 6%: should say it pushes past 6% of balance", () => {
    const result = buildTrade({
      ...longTrade,
      accountBalance: 600,
      atr: 1,
      entryProximal: 13.24,
      entryDistal: 13,
      targetProximal: 15,
      targetDistal: 15.5,
      curveLow: 12,
      curveHigh: 18,
      openTradeRisk: 30,
    });
    expect(result.blockedReason).toBe("over-6pct");
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/6% of your balance/i)).toBeInTheDocument();
    // "Reduce the size" is unanswerable without the limit and the overage.
    expect(screen.getByText(/6% limit is \$36.00/i)).toBeInTheDocument();
    expect(screen.getByText(/\$30.00 already at risk/i)).toBeInTheDocument();
    expect(screen.getByText(/over\./i)).toBeInTheDocument();
  });

  test("given a qualifying score but zones too tight: should say there's no valid trade", () => {
    // Score qualifies (confirmation), but the buffered target can't clear the
    // entry, so buildTrade returns no order.
    const result = buildTrade({
      ...longTrade,
      atr: 0.5,
      entryProximal: 100,
      entryDistal: 99.99,
      targetProximal: 100.1,
      targetDistal: 101,
    });
    expect(result.entryType).toBe("confirmation");
    expect(result.order).toBeNull();
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/no valid trade here/i)).toBeInTheDocument();
  });

  test("given the risk budget can't cover one share: should say the position rounds to zero", () => {
    // Qualifying setup, but a $100 balance can't afford one share's risk.
    const result = buildTrade({ ...longTrade, accountBalance: 100 });
    expect(result.order).toBeNull();
    expect(result.blockedReason).toBe("risk-too-small");
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/rounds down to zero/i)).toBeInTheDocument();
  });

  test("given one share over the capital cap: should say it exceeds 50% of balance", () => {
    // One share ($60) is more than 50% of a $100 balance, so the capital cap
    // forces zero shares even though the risk budget could afford one.
    const result = buildTrade({
      accountBalance: 100,
      riskTolerancePct: 0.02,
      targetBufferPct: 0.75,
      targetMode: "percent",
      direction: "long",
      trend: "uptrend",
      timeframe: "daily",
      atr: 5,
      curveLow: 50,
      curveHigh: 80,
      entryProximal: 60,
      entryDistal: 59,
      targetProximal: 65,
      targetDistal: 66,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.blockedReason).toBe("capital-too-large");
    render(<OrderTicket result={result} direction="long" />);
    expect(screen.getByText(/more than 50% of your balance/i)).toBeInTheDocument();
  });

  test("given a Decision Matrix veto: should say the setup isn't valid for the trend and curve", () => {
    // Supply zone mid-curve in an uptrend (row i): the matrix vetoes it.
    const result = buildTrade({
      ...longTrade,
      direction: "short",
      trend: "uptrend",
      entryProximal: 115,
      entryDistal: 117,
      targetProximal: 105,
      targetDistal: 103,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.objective).toBe("no-trade");
    expect(result.order).toBeNull();
    render(<OrderTicket result={result} direction="short" />);
    expect(
      screen.getByText(/isn't a valid setup for the current trend/i),
    ).toBeInTheDocument();
  });
});
