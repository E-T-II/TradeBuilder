"use client";

import { Check } from "lucide-react";
import type { TradeResult } from "@/lib/trade-builder";
import { JUDGED_MAX } from "@/lib/trade-builder";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const entryTypeLabel = {
  proximal: "Proximal entry",
  confirmation: "Confirmation entry",
  "no-trade": "No trade",
} as const;

const entryTypeClasses = {
  proximal:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  confirmation:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "no-trade": "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
} as const;

function Row({
  label,
  points,
  max,
  detail,
  positive,
}: {
  label: string;
  points: number;
  max: number;
  detail?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        {label}
        {detail ? (
          <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {detail}
            {positive ? (
              <Check
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            ) : null}
          </span>
        ) : null}
      </span>
      <span className="font-mono tabular-nums">
        {points}
        <span className="text-muted-foreground"> / {max}</span>
      </span>
    </div>
  );
}

export function Scorecard({ result }: { result: TradeResult }) {
  const s = result.scorecard;
  const ratio =
    s.profitZoneRatio >= 100
      ? Math.round(s.profitZoneRatio)
      : Math.round(s.profitZoneRatio * 10) / 10;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Odds enhancers</CardTitle>
        <Badge className={entryTypeClasses[result.entryType]}>
          {entryTypeLabel[result.entryType]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <Row
          label="Curve"
          points={s.curve}
          max={1}
          positive={s.curve === 1}
          detail={
            s.curve === 1
              ? `${s.curveZone} — right side`
              : s.curve === 0.5
                ? `${s.curveZone} — middle of the range`
                : `${s.curveZone} — wrong side for this direction`
          }
        />
        <Row
          label="Trend"
          points={s.trend}
          max={2}
          positive={s.trend === 2}
          detail={
            s.trend === 2
              ? "with the trend"
              : s.trend === 1
                ? "sideways — half credit"
                : "against the trend"
          }
        />
        <Row
          label="Profit zone"
          points={s.profitZone}
          max={2}
          positive={s.profitZone === 2}
          detail={
            s.profitZone === 2
              ? `${ratio}:1 — 5:1 or better`
              : s.profitZone === 1
                ? `${ratio}:1 — meets 3:1`
                : `${ratio}:1 — below 3:1`
          }
        />
        <Row label="Strength" points={s.strength} max={JUDGED_MAX.strength} />
        <Row label="Time" points={s.time} max={JUDGED_MAX.time} />
        <Row
          label="Freshness"
          points={s.freshness}
          max={JUDGED_MAX.freshness}
        />

        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between font-medium">
            <span>Total score</span>
            <span className="font-mono tabular-nums">{s.total} / 10</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                result.entryType === "proximal"
                  ? "bg-emerald-500"
                  : result.entryType === "confirmation"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, (s.total / 10) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            8.5+ proximal · 7 to 8.5 confirmation · below 7 no trade
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
