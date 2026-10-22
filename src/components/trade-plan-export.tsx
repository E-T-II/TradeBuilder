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

"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import type { FormState } from "@/components/trade-builder-app";
import {
  isXltMatrixCell,
  type TradeInputs,
  type TradeResult,
} from "@/lib/trade-builder";
import { Button } from "@/components/ui/button";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="trade-plan-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="trade-plan-section">
      <h2>{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

function curveLabel(zone: TradeResult["scorecard"]["curveZone"]): string {
  return zone[0].toUpperCase() + zone.slice(1);
}

function matrixVerdict(result: TradeResult): string {
  const objective = result.objective === "long" ? "Buy long" : "Sell short";
  const requirement = result.scorecard.requiredProfitZoneRatio;
  if (result.objective === "no-trade") {
    return requirement === null
      ? "No trade — this Decision Matrix cell vetoes the setup."
      : `No trade — this cell requires a ${requirement}:1 profit zone; the setup has ${number.format(result.scorecard.profitZoneRatio)}:1.`;
  }
  return requirement === null
    ? `${objective} — approved by the Decision Matrix.`
    : `${objective} — conditional cell met (${requirement}:1 required; ${number.format(result.scorecard.profitZoneRatio)}:1 actual).`;
}

function rejectionReason(result: TradeResult): string {
  if (result.objective === "no-trade") return "Decision Matrix rejected the setup";
  if (result.entryType === "no-trade") return "Score below 7";
  switch (result.blockedReason) {
    case "tight-zones":
      return "Buffered target does not clear the entry";
    case "risk-too-small":
      return "Risk budget cannot cover one share";
    case "capital-too-large":
      return "One share exceeds the 50% capital cap";
    case "reward-risk":
      return "Cannot meet the minimum 3:1 reward-to-risk rule";
    case "over-6pct":
      return "Would exceed the 6% total open-risk limit";
    default:
      return "No executable order was produced";
  }
}

function bufferDescription(result: TradeResult): string {
  const { targetMode, targetBufferPct, targetBufferPending } = result.math;
  if (targetMode === "ratio") return "Mechanical 3:1";
  if (targetMode === "auto") {
    if (targetBufferPending) return "Auto (not resolved before setup rejection)";
    return targetBufferPct === null
      ? "Auto (mechanical 3:1 selected)"
      : `Auto (${targetBufferPct}% selected)`;
  }
  return `${targetBufferPct ?? "—"}%`;
}

export function TradePlanExport({
  form,
  inputs,
  result,
}: {
  form: FormState;
  inputs: TradeInputs;
  result: TradeResult;
}) {
  const order = result.order;
  const checks = result.checks;
  const zoneKey = inputs.direction === "long" ? "demand" : "supply";
  const zoneType = zoneKey === "demand" ? "Demand" : "Supply";
  const targetZoneType = inputs.direction === "long" ? "Supply" : "Demand";
  const isXlt = isXltMatrixCell(
    zoneKey,
    result.scorecard.curveZone,
    inputs.trend,
  );
  const xltCellKey = `${zoneKey}:${result.scorecard.curveZone}:${inputs.trend}`;

  return (
    <>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => window.print()}
      >
        <Printer aria-hidden />
        Print / save plan
      </Button>

      <article className="trade-plan-print" aria-label="Printable trade plan">
        <header className="trade-plan-header">
          <p>Trade Builder</p>
          <h1>{form.ticker || "Trade"} plan</h1>
          <p>
            Prepared {new Date().toLocaleString()} · Review only — verify market
            conditions and all order details before placing a trade.
          </p>
        </header>

        <div className="trade-plan-columns">
          <div>
            <Section title="Trade setup (inputs)">
              <PlanRow label="Direction" value={inputs.direction === "long" ? "Buy long" : "Sell short"} />
              <PlanRow label="Trend" value={inputs.trend} />
              <PlanRow label="Income timeframe" value={inputs.timeframe} />
              <PlanRow label="Account balance" value={usd.format(inputs.accountBalance)} />
              <PlanRow label="Risk per trade" value={`${percent.format(inputs.riskTolerancePct * 100)}% (${usd.format(checks?.maxAccountRisk ?? inputs.accountBalance * inputs.riskTolerancePct)})`} />
              <PlanRow label="Open risk before this trade" value={usd.format(inputs.openTradeRisk ?? 0)} />
              <PlanRow label="Daily ATR" value={usd.format(inputs.atr)} />
              <PlanRow label="Stop buffer" value={`${result.math.stopBufferPct}% of ATR (${usd.format(result.math.stopBufferDollar)})`} />
              <PlanRow label="HTF curve range" value={`Supply: ${usd.format(inputs.curveHigh)} · Demand: ${usd.format(inputs.curveLow)}`} />
              <PlanRow label="Entry curve position" value={curveLabel(result.scorecard.curveZone)} />
              <PlanRow label={`${zoneType} zone (proximal / distal)`} value={`${usd.format(inputs.entryProximal)} / ${usd.format(inputs.entryDistal)}`} />
              <PlanRow label={`${targetZoneType} zone (proximal / distal)`} value={`${usd.format(inputs.targetProximal)} / ${usd.format(inputs.targetDistal)}`} />
              <PlanRow label="Target method" value={`${inputs.targetMode} · ${bufferDescription(result)}`} />
              <PlanRow label="XLT chart criteria" value={!isXlt ? "Not applicable" : form.xltAcknowledgement === xltCellKey ? "Acknowledged" : "Not acknowledged"} />
            </Section>

            <Section title="Matrix verdict">
              <PlanRow label="Decision Matrix" value={matrixVerdict(result)} />
              {result.scorecard.requiredProfitZoneRatio !== null ? (
                <PlanRow
                  label="Conditional profit-zone requirement"
                  value={`${result.scorecard.requiredProfitZoneRatio}:1 required · ${number.format(result.scorecard.profitZoneRatio)}:1 actual`}
                />
              ) : null}
            </Section>
          </div>

          <div>
            <Section title="Odds-enhancer score">
              <PlanRow label="Curve" value={`${result.scorecard.curve} / 1 (${result.scorecard.curveZone})`} />
              <PlanRow label="Trend" value={`${result.scorecard.trend} / 2 (${inputs.trend})`} />
              <PlanRow label="Profit zone" value={`${result.scorecard.profitZone} / 2 (${number.format(result.scorecard.profitZoneRatio)}:1)`} />
              <PlanRow label="Strength" value={`${result.scorecard.strength} / 2`} />
              <PlanRow label="Time" value={`${result.scorecard.time} / 1`} />
              <PlanRow label="Freshness" value={`${result.scorecard.freshness} / 2`} />
              <PlanRow label="Total score" value={`${number.format(result.scorecard.total)} / 10`} />
              <PlanRow label="Entry classification" value={result.entryType === "no-trade" ? "No trade" : `${result.entryType} entry`} />
            </Section>

            <Section title="Order plan">
              {order ? (
                <>
                  <PlanRow
                    label="Order type"
                    value={
                      result.entryType === "proximal"
                        ? `${inputs.direction === "long" ? "Buy" : "Sell short"} limit at the proximal line`
                        : `${inputs.direction === "long" ? "Buy" : "Sell short"} stop-limit 10¢ outside the proximal line`
                    }
                  />
                  <PlanRow label="Entry" value={usd.format(order.entry)} />
                  <PlanRow label="Stop" value={usd.format(order.stop)} />
                  <PlanRow label="Target" value={usd.format(order.target)} />
                  <PlanRow label="Position size" value={`${order.positionSize} shares`} />
                  <PlanRow label="Capital required" value={usd.format(order.capitalRequirement)} />
                  <PlanRow label="Risk per share" value={usd.format(order.riskPerShare)} />
                  <PlanRow label="Total trade risk" value={usd.format(order.totalTradeRisk)} />
                  <PlanRow label="Reward : risk" value={`${number.format(order.rewardRisk)} : 1`} />
                </>
              ) : (
                <>
                  <PlanRow label="Order status" value="No executable order" />
                  <PlanRow label="Reason" value={rejectionReason(result)} />
                </>
              )}
            </Section>

            <Section title="Risk checks">
              {checks ? (
                <>
                  <PlanRow label={`Per-trade risk within ${usd.format(checks.maxAccountRisk)} (${checks.riskLimitPct}%)`} value={checks.withinPerTradeRisk ? "PASS" : "FAIL"} />
                  <PlanRow label="Capital within 50% of balance" value={checks.withinCapitalCap ? "PASS" : "FAIL"} />
                  <PlanRow label="Reward : risk at least 3:1" value={checks.meetsRewardRisk ? "PASS" : "FAIL"} />
                  <PlanRow label={`Total open risk within ${usd.format(checks.multiTradeLimit)} (6% rule)`} value={checks.withinMultiTradeRisk ? "PASS" : "FAIL"} />
                </>
              ) : result.blockedReason === "reward-risk" ? (
                <PlanRow label="Reward : risk at least 3:1" value="FAIL — minimum not met" />
              ) : result.blockedReason === "risk-too-small" ? (
                <PlanRow label="Position fits the per-trade risk budget" value="FAIL — budget cannot cover one share" />
              ) : result.blockedReason === "capital-too-large" ? (
                <PlanRow label="Capital within 50% of balance" value="FAIL — one share exceeds the cap" />
              ) : (
                <PlanRow label="Status" value="Not evaluated — no executable order was produced." />
              )}
            </Section>
          </div>
        </div>

        <footer className="trade-plan-footer">
          This plan is for review and education, not a recommendation or order.
          Confirm prices, sizing, risk, and current market conditions yourself.
        </footer>
      </article>
    </>
  );
}
