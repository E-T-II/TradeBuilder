"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { TradeResult } from "@/lib/trade-builder";
import { JUDGED_MAX } from "@/lib/trade-builder";
import { Reveal, usePrefersReducedMotion } from "@/components/reveal";
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

/** Ease a number from 0 up to target over duration ms. duration 0 snaps. */
function useCountUp(target: number, duration: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) {
        setValue(target * eased);
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Row({
  label,
  points,
  max,
  detail,
  positive,
  negative,
}: {
  label: string;
  points: number;
  max: number;
  detail?: string;
  positive?: boolean;
  negative?: boolean;
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
                className="size-3.5 text-emerald-700 dark:text-emerald-400"
                aria-hidden
              />
            ) : negative ? (
              <X
                className="size-3.5 text-red-600 dark:text-red-400"
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

// Trim a trailing .0 (8.0 -> 8, 7.5 -> 7.5).
function formatScore(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function Scorecard({ result }: { result: TradeResult }) {
  const s = result.scorecard;
  const ratio =
    s.profitZoneRatio >= 100
      ? Math.round(s.profitZoneRatio)
      : Math.round(s.profitZoneRatio * 100) / 100;
  const profitZoneDetail = s.requiredProfitZoneRatio === null
    ? s.profitZone === 2
      ? `${ratio}:1 (5:1 or better)`
      : s.profitZone === 1
        ? `${ratio}:1 (meets 3:1)`
        : `${ratio}:1 (below 3:1)`
    : `${ratio}:1 (XLT requires ${s.requiredProfitZoneRatio}:1)`;

  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Next frame, so transitions have a from-state to animate.
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const animatedTotal = useCountUp(s.total, reduced ? 0 : 750);
  const barWidth = Math.min(100, (animatedTotal / 10) * 100);


  const rows = [

    <Row key="strength" label="Strength" points={s.strength} max={JUDGED_MAX.strength} />,
    <Row key="time" label="Time" points={s.time} max={JUDGED_MAX.time} />,
    <Row key="freshness" label="Freshness" points={s.freshness} max={JUDGED_MAX.freshness} />,

    <Row
      key="trend"
      label="Trend"
      points={s.trend}
      max={2}
      positive={s.trend === 2}
      negative={s.trend === 0}
      detail={
        s.trend === 2
          ? "with the trend"
          : s.trend === 1
            ? "sideways (half credit)"
            : "against the trend"
      }
    />,

    <Row
      key="curve"
      label="Curve"
      points={s.curve}
      max={1}
      positive={s.curve === 1}
      negative={s.curve === 0}
      detail={
        s.curve === 1
          ? `${s.curveZone} (good side)`
          : s.curve === 0.5
            ? `${s.curveZone} (mid range)`
            : `${s.curveZone} (wrong side)`
      }
    />,

    <Row
      key="profit"
      label="Profit zone"
      points={s.profitZone}
      max={2}
      positive={s.profitZone === 2}
      negative={s.profitZone === 0}
      detail={profitZoneDetail}
    />,
    //<Row key="strength" label="Strength" points={s.strength} max={JUDGED_MAX.strength} />,
    //<Row key="time" label="Time" points={s.time} max={JUDGED_MAX.time} />,
    //<Row key="freshness" label="Freshness" points={s.freshness} max={JUDGED_MAX.freshness} />,
  ];

  // The score can qualify yet still produce no order (a matrix veto, zones too
  // tight, or a position that rounds to zero shares). Show that as its own
  // neutral state instead of an entry-type badge that would contradict the
  // "no trade" order panel.
  const noValidTrade = result.order === null && result.entryType !== "no-trade";
  const badgeLabel = noValidTrade
    ? "No valid trade"
    : entryTypeLabel[result.entryType];
  const badgeClasses = noValidTrade
    ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
    : entryTypeClasses[result.entryType];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Odds enhancers</CardTitle>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <Badge
            className={`${badgeClasses} shrink-0 origin-right transition-all duration-500 ease-out motion-reduce:!transition-none ${shown ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
          >
            {badgeLabel}
          </Badge>
          {result.scorecard.confirmationRequiredByXlt ? (
            <p className="text-left text-xs text-muted-foreground">
              XLT requires this confirmation entry. Your 8.5+ odds-enhancer
              score qualified the setup; it did not select the order type.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row, i) => (
          <Reveal key={i} delay={80 + i * 60}>
            {row}
          </Reveal>
        ))}

        <Reveal delay={80 + rows.length * 60}>
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between font-medium">
              <span>Total score</span>
              <span className="font-mono tabular-nums">
                {formatScore(animatedTotal)} / 10
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${noValidTrade
                  ? "bg-neutral-400 dark:bg-neutral-500"
                  : result.entryType === "proximal"
                    ? "bg-emerald-500"
                    : result.entryType === "confirmation"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              8.5+ proximal · 7 to 8.5 confirmation · below 7 no trade
            </p>
          </div>
        </Reveal>
      </CardContent>
    </Card>
  );
}
