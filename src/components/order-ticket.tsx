import type { Direction, TradeResult } from "@/lib/trade-builder";
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
    // Two ways to land here: the score didn't qualify, or it did but the zones
    // are so tight the target ends up on the wrong side of the entry.
    const scoredButInvalid = result.entryType !== "no-trade";
    return (
      <Alert>
        <AlertTitle>No trade</AlertTitle>
        <AlertDescription>
          {scoredButInvalid
            ? "The score qualifies, but after the buffer the target lands on the wrong side of the entry, so there's no valid trade here. Widen the gap between your entry and target zones."
            : "The score is below 7, so this setup doesn't qualify. If we did not score the trade, we will not take the trade."}
        </AlertDescription>
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
          value={`${Math.round(o.rewardRisk * 100) / 100} : 1`}
        />
      </CardContent>
    </Card>
  );
}
