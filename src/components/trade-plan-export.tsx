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
  type TradeInputs,
  type TradeResult,
} from "@/lib/trade-builder";
import { isXltVerified, xltScenario } from "@/lib/xlt-criteria";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useCurrency } from "@/components/currency-provider";
import { CurrencyNote } from "@/components/currency-note";
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function PlanRow({ label, value }: { label: string; value: string }) {
  const { text: tx } = useLanguage();
  return (
    <div className="trade-plan-row">
      <dt>{tx(label)}</dt>
      <dd>{tx(value)}</dd>
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
  const { text: tx } = useLanguage();
  return (
    <section className="trade-plan-section">
      <h2>{tx(title)}</h2>
      <dl>{children}</dl>
    </section>
  );
}

function curveLabel(zone: TradeResult["scorecard"]["curveZone"]): string {
  return zone[0].toUpperCase() + zone.slice(1);
}

function matrixVerdict(result: TradeResult, tx: (message: string) => string): string {
  const objective = tx(result.objective === "long" ? "Buy long" : "Sell short");
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
  const { text: tx } = useLanguage();
  const usd = useCurrency();
  const order = result.order;
  const checks = result.checks;
  const zoneKey = inputs.direction === "long" ? "demand" : "supply";
  const zoneType = zoneKey === "demand" ? "Demand" : "Supply";
  const targetZoneType = inputs.direction === "long" ? "Supply" : "Demand";
  const xlt = xltScenario(
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
        onClick={() => {
          delete document.body.dataset.printReport;
          window.print();
        }}
      >
        <Printer aria-hidden />{tx("Print / save plan")}</Button>

      <article className="trade-plan-print" aria-label={tx("Printable trade plan")}>
        <header className="trade-plan-header">
          <p>{tx("Trade Builder")}</p>
          <h1>{tx("{0} plan", [form.ticker || tx("Trade")])}</h1>
          <p>{tx("Prepared {0} · Review only — verify market conditions and all order details before placing a trade.", [tx(new Date().toLocaleString())])}</p>
          <CurrencyNote />
        </header>

        <div className="trade-plan-columns">
          <div>
            <Section title={tx("Trade setup (inputs)")}>
              <PlanRow label={tx("Direction")} value={inputs.direction === "long" ? "Buy long" : "Sell short"} />
              <PlanRow label={tx("Trend")} value={inputs.trend} />
              <PlanRow label={tx("Income timeframe")} value={inputs.timeframe} />
              <PlanRow label={tx("Account balance")} value={usd.format(inputs.accountBalance)} />
              <PlanRow label={tx("Risk per trade")} value={`${percent.format(inputs.riskTolerancePct * 100)}% (${usd.format(checks?.maxAccountRisk ?? inputs.accountBalance * inputs.riskTolerancePct)})`} />
              <PlanRow label={tx("Open risk before this trade")} value={usd.format(inputs.openTradeRisk ?? 0)} />
              <PlanRow label={tx("Daily ATR")} value={usd.format(inputs.atr)} />
              <PlanRow label={tx("Stop buffer")} value={`${result.math.stopBufferPct}% of ATR (${usd.format(result.math.stopBufferDollar)})`} />
              <PlanRow label={tx("HTF curve range")} value={`Supply: ${usd.format(inputs.curveHigh)} · Demand: ${usd.format(inputs.curveLow)}`} />
              <PlanRow label={tx("Entry curve position")} value={curveLabel(result.scorecard.curveZone)} />
              <PlanRow label={tx("{0} zone (proximal / distal)", [tx(zoneType)])} value={`${usd.format(inputs.entryProximal)} / ${usd.format(inputs.entryDistal)}`} />
              <PlanRow label={tx("{0} zone (proximal / distal)", [tx(targetZoneType)])} value={`${usd.format(inputs.targetProximal)} / ${usd.format(inputs.targetDistal)}`} />
              <PlanRow label={tx("Target method")} value={`${tx(inputs.targetMode)} · ${tx(bufferDescription(result))}`} />
              <PlanRow label={tx("XLT chart checks")} value={!xlt ? "Not applicable" : isXltVerified(form.xltAcknowledgement, xltCellKey, xlt.items.length) ? tx("{0} — verified", [tx(xlt.title)]) : "Not verified"} />
            </Section>

            <Section title={tx("Matrix verdict")}>
              <PlanRow label={tx("Decision Matrix")} value={matrixVerdict(result, tx)} />
              {result.scorecard.requiredProfitZoneRatio !== null ? (
                <PlanRow
                  label={tx("Conditional profit-zone requirement")}
                  value={`${result.scorecard.requiredProfitZoneRatio}:1 required · ${number.format(result.scorecard.profitZoneRatio)}:1 actual`}
                />
              ) : null}
            </Section>
          </div>

          <div>
            <Section title={tx("Odds-enhancer score")}>
              <PlanRow label={tx("Curve")} value={`${result.scorecard.curve} / 1 (${tx(result.scorecard.curveZone)})`} />
              <PlanRow label={tx("Trend")} value={`${result.scorecard.trend} / 2 (${tx(inputs.trend)})`} />
              <PlanRow label={tx("Profit zone")} value={`${result.scorecard.profitZone} / 2 (${number.format(result.scorecard.profitZoneRatio)}:1)`} />
              <PlanRow label={tx("Strength")} value={`${result.scorecard.strength} / 2`} />
              <PlanRow label={tx("Time")} value={`${result.scorecard.time} / 1`} />
              <PlanRow label={tx("Freshness")} value={`${result.scorecard.freshness} / 2`} />
              <PlanRow label={tx("Total score")} value={`${number.format(result.scorecard.total)} / 10`} />
              <PlanRow label={tx("Entry classification")} value={result.entryType === "no-trade" ? "No trade" : tx("{0} entry", [tx(result.entryType)])} />
            </Section>

            <Section title={tx("Order plan")}>
              {order ? (
                <>
                  <PlanRow
                    label={tx("Order type")}
                    value={
                      result.entryType === "proximal"
                        ? tx("{0} limit at the proximal line", [tx(inputs.direction === "long" ? "Buy" : "Sell short")])
                        : tx("{0} stop-limit 10¢ outside the proximal line", [tx(inputs.direction === "long" ? "Buy" : "Sell short")])
                    }
                  />
                  <PlanRow label={tx("Entry")} value={usd.format(order.entry)} />
                  <PlanRow label={tx("Stop")} value={usd.format(order.stop)} />
                  <PlanRow label={tx("Target")} value={usd.format(order.target)} />
                  <PlanRow label={tx("Position size")} value={`${order.positionSize} shares`} />
                  <PlanRow label={tx("Capital required")} value={usd.format(order.capitalRequirement)} />
                  <PlanRow label={tx("Risk per share")} value={usd.format(order.riskPerShare)} />
                  <PlanRow label={tx("Total trade risk")} value={usd.format(order.totalTradeRisk)} />
                  <PlanRow label={tx("Reward : risk")} value={`${number.format(order.rewardRisk)} : 1`} />
                </>
              ) : (
                <>
                  <PlanRow label={tx("Order status")} value="No executable order" />
                  <PlanRow label={tx("Reason")} value={rejectionReason(result)} />
                </>
              )}
            </Section>

            <Section title={tx("Risk checks")}>
              {checks ? (
                <>
                  <PlanRow label={tx("Per-trade risk within {0} ({1}%)", [tx(usd.format(checks.maxAccountRisk)), tx(checks.riskLimitPct)])} value={checks.withinPerTradeRisk ? "PASS" : "FAIL"} />
                  <PlanRow label={tx("Capital within 50% of balance")} value={checks.withinCapitalCap ? "PASS" : "FAIL"} />
                  <PlanRow label={tx("Reward : risk at least 3:1")} value={checks.meetsRewardRisk ? "PASS" : "FAIL"} />
                  <PlanRow label={tx("Total open risk within {0} (6% rule)", [tx(usd.format(checks.multiTradeLimit))])} value={checks.withinMultiTradeRisk ? "PASS" : "FAIL"} />
                </>
              ) : result.blockedReason === "reward-risk" ? (
                <PlanRow label={tx("Reward : risk at least 3:1")} value="FAIL — minimum not met" />
              ) : result.blockedReason === "risk-too-small" ? (
                <PlanRow label={tx("Position fits the per-trade risk budget")} value="FAIL — budget cannot cover one share" />
              ) : result.blockedReason === "capital-too-large" ? (
                <PlanRow label={tx("Capital within 50% of balance")} value="FAIL — one share exceeds the cap" />
              ) : (
                <PlanRow label={tx("Status")} value="Not evaluated — no executable order was produced." />
              )}
            </Section>
          </div>
        </div>

        <footer className="trade-plan-footer">{tx("This plan is for review and education, not a recommendation or order. Confirm prices, sizing, risk, and current market conditions yourself.")}</footer>
      </article>
    </>
  );
}
