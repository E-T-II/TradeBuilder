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

import {
  roundToCent,
  type Direction,
  type TradeResult,
} from "@/lib/trade-builder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Reward:risk reads as "2.6", not "2.5999999999" or a flat "3".
const ratio = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        strong && "font-medium",
      )}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

// How the target buffer reads. Auto names itself (per Eugene: the user should
// know what was selected, not just see a number), and adds what it landed on
// once its comparison has run — "Auto" alone before that (a no-trade that never
// got there). Percent shows its buffer; ratio, the mechanical target.
function targetBufferText(math: TradeResult["math"]): string {
  if (math.targetMode === "auto") {
    if (math.targetBufferPending) return "Auto";
    return math.targetBufferPct === null
      ? "Auto (Mechanical 3:1)"
      : `Auto (${math.targetBufferPct}%)`;
  }
  if (math.targetMode === "ratio") return "Mechanical 3:1";
  return `${math.targetBufferPct}%`;
}

// The "show the math" breakdown (per Eugene): the working behind Stop/Target.
// Shown under the built order, and again on the no-trade screen, where the
// wrapper greys the whole block so the numbers read as context, not an order.
function MathLines({ math }: { math: TradeResult["math"] }) {
  return (
    <>
      <Line label="Target buffer %" value={targetBufferText(math)} />
      {math.targetBufferDollar !== null ? (
        <Line label="Target buffer $" value={usd.format(math.targetBufferDollar)} />
      ) : null}
      <Line label="Daily ATR" value={usd.format(math.dailyAtr)} />
      <Line label="Stop buffer %" value={`${math.stopBufferPct}%`} />
      <Line label="Stop buffer $" value={usd.format(math.stopBufferDollar)} />
    </>
  );
}

export function OrderTicket({
  result,
  direction,
}: {
  result: TradeResult;
  direction: Direction;
}) {
  if (!result.order) {
    // Seven ways to land here: the matrix vetoed the setup, the score didn't
    // qualify, the zones are too tight, the position rounds to zero shares
    // (two causes), or the reward:risk / 6% hard rules rejected it outright.
    let reason: string;
    if (result.objective === "no-trade") {
      reason =
        "This zone isn't a valid setup for the current trend and curve position, so the strategy calls no trade. The opposite direction may qualify.";
    } else if (result.blockedReason === "xlt-proximal-score") {
      reason =
        "This aggressive XLT setup must first score 8.5 or higher (a proximal score) before a confirmation entry is allowed.";
    } else if (result.entryType === "no-trade") {
      reason =
        "The score is below 7, so this setup doesn't qualify. If the trade score is not probable, we will not take the trade.";
    } else if (result.blockedReason === "reward-risk") {
      // The ratio is absent when the mechanical target overshot the opposing
      // zone — there the setup's own reward:risk isn't what was rejected.
      const reached =
        result.reachedRewardRisk === undefined
          ? "This setup can't reach a 3:1 reward-to-risk before the opposing zone"
          : `This setup only reaches ${ratio.format(result.reachedRewardRisk)}:1 reward-to-risk ratio, short of the 3:1 minimum`;
      reason = `${reached}, so the strategy rejects it. You'd need a farther target zone or a tighter stop.`;
    } else if (result.blockedReason === "over-6pct") {
      // Naming the rule without the numbers leaves "reduce the size" unanswerable,
      // so spell out the limit, the two halves of the sum, and the overage.
      const limit = result.checks?.multiTradeLimit;
      const open = result.openRisk;
      const trade = result.totalTradeRisk;
      const detail =
        limit === undefined || open === undefined || trade === undefined
          ? ""
          : ` Your 6% limit is ${usd.format(limit)}: ${usd.format(open)} already at risk plus ${usd.format(trade)} on this trade is ${usd.format(
            roundToCent(open + trade - limit),
          )} over.`;
      reason = `Taking this trade would push your total open risk past 6% of your balance, so the strategy rejects it.${detail} Close some open risk or reduce the size before adding this one.`;
    } else if (result.blockedReason === "risk-too-small") {
      reason =
        "Your risk-per-trade limit is smaller than the risk on a single share here, so the position rounds down to zero. Try a larger balance or a tighter stop (a lower ATR or a smaller entry zone).";
    } else if (result.blockedReason === "capital-too-large") {
      reason =
        "One share costs more than 50% of your balance, so no position fits within the capital cap. You'd need a larger balance (or a lower-priced stock).";
    } else {
      reason =
        "The score qualifies, but after the buffer the target lands on the wrong side of the entry, so there's no valid trade here. Widen the gap between your entry and target zones.";
    }
    return (
      <div className="space-y-3">
        <Alert>
          <AlertTitle>No trade</AlertTitle>
          <AlertDescription>{reason}</AlertDescription>
        </Alert>
        {/* The math still applies even without an order (per Eugene): show it in
            gray so the ATR and buffers behind the rejected setup stay visible.
            text-muted-foreground on the box greys every row by inheritance (the
            Line values set no colour of their own); on the order card they take
            the Card's normal foreground instead. Chrome matches the alert above;
            the heading gives the standalone rows the context the order card gets
            from the order lines above them. */}
        <div className="space-y-2 rounded-lg border bg-card px-2.5 py-2 text-muted-foreground">
          <p className="text-sm font-medium">Behind the numbers</p>
          <MathLines math={result.math} />
        </div>
      </div>
    );
  }

  const o = result.order;
  const verb = direction === "long" ? "Buy" : "Sell short";
  const orderKind =
    result.entryType === "proximal"
      ? "limit order at the proximal line"
      : "stop limit order 10¢ before the proximal line";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your S.E.T.S. order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Line label="Stop loss" value={usd.format(o.stop)} strong />
        <Line label="Entry price" value={usd.format(o.entry)} strong />
        <Line label="Target price" value={usd.format(o.target)} strong />
        <p className="text-sm font-medium">
          {verb} {o.positionSize} shares, {orderKind}
        </p>
        <div className="my-3 border-t" />
        <Line
          label="Capital required"
          value={usd.format(o.capitalRequirement)}
        />
        <Line label="Risk per share" value={usd.format(o.riskPerShare)} />
        <Line label="Total trade risk" value={usd.format(o.totalTradeRisk)} />
        <Line
          label="Reward : risk (needs 3:1)"
          value={`${ratio.format(o.rewardRisk)} : 1`}
        />
        <div className="my-3 border-t" />
        {/* The working behind Stop/Target, so the numbers above aren't a black
            box (per Eugene). */}
        <MathLines math={result.math} />
      </CardContent>
    </Card>
  );
}
