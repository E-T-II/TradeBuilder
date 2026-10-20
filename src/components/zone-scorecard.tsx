"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { FormState } from "@/components/trade-builder-app";
import {
  curveScore,
  deriveZoneLines,
  JUDGED_MAX,
  locateOnCurve,
  profitZoneRatio,
  profitZoneScore,
  trendScore,
  type Direction,
} from "@/lib/trade-builder";
import { Label } from "@/components/ui/label";
import { StrengthReference } from "@/components/strength-reference";
import { TimeReference } from "@/components/time-reference";
import { FreshnessReference } from "@/components/freshness-reference";

const factors = {
  strength: { label: "Strength", Reference: StrengthReference },
  time: { label: "Time", Reference: TimeReference },
  freshness: { label: "Freshness", Reference: FreshnessReference },
} as const;

export interface ZoneRatings {
  strength: string;
  time: string;
  freshness: string;
}

function ScoreSelector({
  id,
  label,
  value,
  direction,
  Reference,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  direction: Direction;
  Reference: typeof StrengthReference;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [popupTop, setPopupTop] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePopupPosition = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (buttonRect) setPopupTop(buttonRect.bottom + 8);
    };
    updatePopupPosition();
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node &&
        !buttonRef.current?.contains(event.target) &&
        !popupRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative justify-self-start">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-labelledby={`${id}-label`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-9 w-11 items-center justify-center rounded-lg border border-input bg-background px-1 text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>{value}</span>
      </button>
      {open ? (
        <div
          ref={popupRef}
          style={{ top: popupTop === null ? "50%" : `${popupTop}px` }}
          className={`fixed left-1/2 z-100 -translate-x-1/2 shadow-xl ${label === "Time" ? "w-[min(34rem,calc(100vw-2.5rem))]" : "w-[min(39.5rem,calc(100vw-2.5rem))]"}`}
        >
          <Reference
            direction={direction}
            selected={value === "" ? null : Number(value)}
            onSelect={(score) => {
              onChange(String(score));
              setOpen(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ZoneScorecard({
  form,
  direction,
  ratings,
  onChange,
  opposing = false,
}: {
  form: FormState;
  direction: Direction;
  ratings: ZoneRatings;
  onChange: (patch: Partial<ZoneRatings>) => void;
  opposing?: boolean;
}) {
  const computedScores = (() => {
    const numbers = [
      Number(form.curveLow), Number(form.curveHigh),
      Number(form.demandHigh), Number(form.demandLow),
      Number(form.supplyHigh), Number(form.supplyLow),
    ];
    if (numbers.some((value) => !Number.isFinite(value))) return null;
    const [curveLow, curveHigh, demandHigh, demandLow, supplyHigh, supplyLow] = numbers;
    if (curveHigh <= curveLow) return null;
    const lines = deriveZoneLines({ demandHigh, demandLow, supplyHigh, supplyLow }, direction);
    const curve = locateOnCurve(lines.entryProximal, curveLow, curveHigh);
    const ratio = profitZoneRatio(lines.entryProximal, lines.entryDistal, lines.targetProximal);
    return {
      trend: trendScore(form.trend, direction),
      curve: curveScore(curve, direction),
      profitZone: profitZoneScore(ratio),
    };
  })();
  const total = computedScores && Object.values(ratings).every((value) => value !== "")
    ? computedScores.trend + computedScores.curve + computedScores.profitZone +
      Number(ratings.strength) + Number(ratings.time) + Number(ratings.freshness)
    : null;
  const prefix = opposing ? "opposing-" : "";
  const name = opposing ? "Target zone" : "Entry zone";
  const demand = direction === "long";
  const DirectionIcon = demand ? TrendingUp : TrendingDown;

  return (
    <section
      aria-label={`${name} scorecard`}
      className={`min-w-0 space-y-4 rounded-xl border border-t-4 bg-linear-to-b p-2 transition-shadow duration-300 motion-reduce:transition-none sm:p-4 ${
        demand
          ? "border-emerald-200 border-t-emerald-500 from-emerald-50/80 to-background hover:shadow-[0_0_20px_-6px_rgba(16,185,129,0.3)] dark:border-emerald-900 dark:border-t-emerald-400 dark:from-emerald-950/40"
          : "border-red-200 border-t-red-500 from-red-50/80 to-background hover:shadow-[0_0_20px_-6px_rgba(239,68,68,0.3)] dark:border-red-900 dark:border-t-red-400 dark:from-red-950/40"
      }`}
    >
      <div className="space-y-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
          demand
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
            : "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200"
        }`}>
          <DirectionIcon className="size-3.5" aria-hidden />
          {demand ? "Demand · Buy" : "Supply · Sell"}
        </span>
        <h3 className="text-base font-semibold">{name}</h3>
        <p className="text-xs text-muted-foreground">
          {direction === "long" ? "Demand" : "Supply"} zone
          {opposing ? " - for comparison only" : " - used for your trade"}
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_1.5rem] items-center gap-x-2 gap-y-3 lg:grid-cols-[minmax(0,1fr)_3rem_4rem] lg:gap-x-3">
        <div className="text-xs font-medium text-muted-foreground">Odds Enhancer</div>
        <div className="text-center text-xs font-medium text-muted-foreground">Score</div>
        <div className="text-center text-xs font-medium text-muted-foreground">Max</div>
        {(["strength", "time", "freshness"] as const).map((key) => {
          const { label, Reference } = factors[key];
          const id = `${prefix}${key}`;
          return (
            <Fragment key={key}>
              <Label id={`${id}-label`}>{label}</Label>
              <ScoreSelector
                id={id}
                label={label}
                value={ratings[key]}
                direction={direction}
                Reference={Reference}
                onChange={(value) => onChange({ [key]: value })}
              />
              <div className="text-center font-mono text-sm tabular-nums">{JUDGED_MAX[key]}</div>
            </Fragment>
          );
        })}
        <div className="col-span-3 mt-1 border-t pt-3 text-xs font-medium text-muted-foreground">
          Auto-scored odds enhancers
        </div>
        {([
          ["trend", "Trend", 2],
          ["curve", "Curve", 1],
          ["profitZone", "Profit zone", 2],
        ] as const).map(([key, label, max]) => (
          <Fragment key={key}>
            <span className="text-sm text-muted-foreground">{label}</span>
            <output className="text-center font-mono text-sm tabular-nums" aria-label={`${label} score`}>
              {computedScores?.[key] ?? "-"}
            </output>
            <div className="text-center font-mono text-sm tabular-nums">{max}</div>
          </Fragment>
        ))}
        <span className={`col-span-3 mt-1 grid grid-cols-[minmax(0,1fr)_2.75rem_1.5rem] items-center gap-x-2 rounded-lg border-t px-1 py-3 font-medium lg:grid-cols-[minmax(0,1fr)_3rem_4rem] lg:gap-x-3 ${
          demand
            ? "border-emerald-200 bg-emerald-100/60 dark:border-emerald-900 dark:bg-emerald-950/50"
            : "border-red-200 bg-red-100/60 dark:border-red-900 dark:bg-red-950/50"
        }`}>
          <span>Total score</span>
          <output className="text-center font-mono text-sm tabular-nums" aria-label="Total odds-enhancer score">
            {total ?? "-"}
          </output>
          <span className="text-center font-mono text-sm tabular-nums">10</span>
        </span>
      </div>
    </section>
  );
}
