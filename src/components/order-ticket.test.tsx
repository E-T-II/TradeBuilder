// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { buildTrade, type TradeInputs } from "@/lib/trade-builder";
import { OrderTicket } from "@/components/order-ticket";

// A valid long confirmation setup; override per case.
const longTrade: TradeInputs = {
  accountBalance: 2500,
  riskTolerancePct: 0.02,
  targetBufferPct: 0.75,
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
});
