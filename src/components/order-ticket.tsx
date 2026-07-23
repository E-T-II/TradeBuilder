import { roundToCent, type Direction, type TradeResult } from "@/lib/trade-builder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      className={`flex items-center justify-between text-sm ${
        strong ? "font-medium" : ""
      }`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
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
    } else if (result.entryType === "no-trade") {
      reason =
        "The score is below 7, so this setup doesn't qualify. If we did not score the trade, we will not take the trade.";
    } else if (result.blockedReason === "reward-risk") {
      // The ratio is absent when the mechanical target overshot the opposing
      // zone — there the setup's own reward:risk isn't what was rejected.
      const reached =
        result.rewardRisk === undefined
          ? "This setup can't reach a 3:1 reward-to-risk before the opposing zone"
          : `This setup only reaches ${ratio.format(result.rewardRisk)}:1, short of the 3:1 minimum`;
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
      <Alert>
        <AlertTitle>No trade</AlertTitle>
        <AlertDescription>{reason}</AlertDescription>
      </Alert>
    );
  }

  const o = result.order;
  const verb = direction === "long" ? "Buy" : "Sell short";
  const orderKind =
    result.entryType === "proximal"
      ? "limit order at the proximal line"
      : "stop limit order 10¢ past the proximal line";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">
          {verb} {o.positionSize} shares, {orderKind}
        </p>
        <Line label="Entry price" value={usd.format(o.entry)} strong />
        <Line label="Stop loss" value={usd.format(o.stop)} strong />
        <Line label="Target price" value={usd.format(o.target)} strong />
        <div className="my-3 border-t" />
        <Line label="Risk per share" value={usd.format(o.riskPerShare)} />
        <Line label="Total trade risk" value={usd.format(o.totalTradeRisk)} />
        <Line
          label="Capital required"
          value={usd.format(o.capitalRequirement)}
        />
        <Line
          label="Reward : risk (needs 3:1)"
          value={`${ratio.format(o.rewardRisk)} : 1`}
        />
      </CardContent>
    </Card>
  );
}
