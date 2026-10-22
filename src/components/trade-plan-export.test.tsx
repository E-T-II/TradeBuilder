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
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { FormState } from "@/components/trade-builder-app";
import { TradePlanExport } from "@/components/trade-plan-export";
import {
  buildTrade,
  type TradeInputs,
} from "@/lib/trade-builder";

const form: FormState = {
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
  strength: "1",
  time: "0.5",
  freshness: "1",
  opposingStrength: "",
  opposingTime: "",
  opposingFreshness: "",
  openTradeRisk: "0",
  xltAcknowledgement: "",
};

const inputs: TradeInputs = {
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
  openTradeRisk: 0,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("given TradePlanExport", () => {
  test("given a qualifying setup: should print the assumptions, order, score, and risk checks", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const result = buildTrade(inputs);

    render(<TradePlanExport form={form} inputs={inputs} result={result} />);

    expect(result.order).not.toBeNull();
    expect(screen.getByText("NVDA plan")).toBeInTheDocument();
    expect(screen.getByText("Supply: $130.00 · Demand: $100.00")).toBeInTheDocument();
    expect(screen.getByText("Decision Matrix")).toBeInTheDocument();
    expect(screen.getByText("Buy long — approved by the Decision Matrix.")).toBeInTheDocument();
    expect(screen.getByText(/Buy stop-limit 10¢ outside the proximal line/)).toBeInTheDocument();
    expect(screen.getByText("2 / 2 (uptrend)")).toBeInTheDocument();
    expect(screen.getByText("Position size")).toBeInTheDocument();
    expect(screen.getByText("Reward : risk")).toBeInTheDocument();
    expect(screen.getAllByText("PASS")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "Print / save plan" }));
    expect(print).toHaveBeenCalledOnce();
  });

  test("given a matrix veto: should export the rejection instead of presenting an order", () => {
    const shortInputs: TradeInputs = {
      ...inputs,
      direction: "short",
      entryProximal: 115,
      entryDistal: 117,
      targetProximal: 105,
      targetDistal: 103,
    };
    const shortForm: FormState = {
      ...form,
      direction: "short",
      demandHigh: "105",
      demandLow: "103",
      supplyLow: "115",
      supplyHigh: "117",
    };
    const result = buildTrade(shortInputs);

    render(<TradePlanExport form={shortForm} inputs={shortInputs} result={result} />);

    expect(result.order).toBeNull();
    expect(screen.getByText(/this Decision Matrix cell vetoes the setup/i)).toBeInTheDocument();
    expect(screen.getByText("No executable order")).toBeInTheDocument();
    expect(screen.getByText("Decision Matrix rejected the setup")).toBeInTheDocument();
    expect(screen.getByText(/Not evaluated — no executable order was produced/i)).toBeInTheDocument();
  });

  test("given a reward-to-risk rejection: should include the failed risk check", () => {
    const shortProfitInputs: TradeInputs = {
      ...inputs,
      targetProximal: 109.74,
      targetDistal: 111,
      strength: 2,
      time: 1,
      freshness: 2,
    };
    const result = buildTrade(shortProfitInputs);

    render(<TradePlanExport form={form} inputs={shortProfitInputs} result={result} />);

    expect(result.blockedReason).toBe("reward-risk");
    expect(screen.getByText("FAIL — minimum not met")).toBeInTheDocument();
  });
});
