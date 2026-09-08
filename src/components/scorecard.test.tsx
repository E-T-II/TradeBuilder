// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test } from "vitest";

import { buildTrade, type TradeInputs } from "@/lib/trade-builder";
import { Scorecard } from "@/components/scorecard";

// jsdom implements neither of these, and the scorecard's reveal/count-up
// effects call them on mount. No-op rAF keeps the render deterministic; we
// assert the badge text, which is in the DOM regardless of the animation.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() { },
    removeEventListener() { },
    addListener() { },
    removeListener() { },
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
  window.requestAnimationFrame = (() => 0) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = (() => { }) as typeof window.cancelAnimationFrame;
});

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

describe("given Scorecard", () => {
  test("given a qualifying score with no valid order: should show No valid trade, not the entry-type badge", () => {
    // Score qualifies (confirmation), but the zones are too tight for an order.
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

    render(<Scorecard result={result} />);
    expect(screen.getByText("No valid trade")).toBeInTheDocument();
    expect(screen.queryByText("Confirmation entry")).not.toBeInTheDocument();
  });

  test("given a valid confirmation order: should show the Confirmation entry badge", () => {
    const result = buildTrade(longTrade);
    expect(result.order).not.toBeNull();

    render(<Scorecard result={result} />);
    expect(screen.getByText("Confirmation entry")).toBeInTheDocument();
    expect(screen.queryByText("No valid trade")).not.toBeInTheDocument();
  });

  test("given an aggressive XLT confirmation: should explain it was not score-selected", () => {
    const result = buildTrade({
      ...longTrade,
      curveLow: 90,
      curveHigh: 110,
      strength: 2,
      time: 1,
      freshness: 2,
    });
    expect(result.scorecard.confirmationRequiredByXlt).toBe(true);

    render(<Scorecard result={result} />);
    expect(screen.getByText(/xlt requires this confirmation entry/i)).toBeInTheDocument();
    expect(screen.getByText(/did not select the order type/i)).toBeInTheDocument();
  });

  test("should show the profit-zone ratio to two decimal places", () => {
    const result = buildTrade({
      ...longTrade,
      curveLow: 250,
      curveHigh: 350,
      entryProximal: 286.73,
      entryDistal: 279.85,
      targetProximal: 338.19,
      targetDistal: 340,
    });

    render(<Scorecard result={result} />);

    expect(screen.getByText(/7\.48:1/)).toBeInTheDocument();
  });

  test("should show the 3:1 XLT profit-zone requirement for a conditional conservative setup", () => {
    const result = buildTrade({
      ...longTrade,
      trend: "downtrend",
      targetProximal: 114,
      targetDistal: 116,
    });

    render(<Scorecard result={result} />);

    expect(screen.getByText(/3:1 \(XLT requires 3:1\)/)).toBeInTheDocument();
  });

  test("should show the 5:1 XLT profit-zone requirement for an aggressive setup", () => {
    const result = buildTrade({
      ...longTrade,
      curveLow: 90,
      curveHigh: 110,
      targetProximal: 114,
      targetDistal: 116,
    });

    render(<Scorecard result={result} />);

    expect(screen.getByText(/3:1 \(XLT requires 5:1\)/)).toBeInTheDocument();
  });
});
