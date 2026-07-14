"use client";

import { Fragment } from "react";
import type { FormState } from "@/components/trade-builder-app";
import { JUDGED_MAX } from "@/lib/trade-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingChips } from "@/components/rating-chips";
import { SegmentedControl } from "@/components/segmented-control";

export const STEPS = [
  { title: "Account", blurb: "How much you're working with" },
  { title: "Trade", blurb: "What you're trading and which way" },
  { title: "Zones", blurb: "The price lines from your chart" },
  { title: "Your judgment", blurb: "Score the zone quality yourself" },
] as const;

/** Required fields per step — Next stays disabled until these are filled. */
export const STEP_FIELDS: (keyof FormState)[][] = [
  ["accountBalance"],
  ["atr"],
  [
    "curveLow",
    "curveHigh",
    "entryProximal",
    "entryDistal",
    "targetProximal",
    "targetDistal",
  ],
  [],
];

/** The first step that still has an empty required field (or one past the end). */
export function firstIncompleteStep(form: FormState): number {
  for (let i = 0; i < STEP_FIELDS.length; i++) {
    if (STEP_FIELDS[i].some((key) => form[key].trim() === "")) return i;
  }
  return STEPS.length;
}

interface TradeFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  step: number;
  onBack: () => void;
  onNext: () => void;
  onLoadExample: () => void;
  onReset: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PriceInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Horizontal step indicator for the top bar on large screens — a checkmark
 * for finished steps, the current step outlined, and a connecting line
 * that's solid behind completed steps and dashed ahead. Completed steps
 * are clickable to jump back.
 */
export function TopStepper({
  step,
  reachable,
  onJump,
}: {
  step: number;
  reachable: number;
  onJump: (step: number) => void;
}) {
  return (
    <nav aria-label="Steps" className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const clickable = i <= reachable && !current;
        return (
          <Fragment key={s.title}>
            {i > 0 ? (
              <span
                aria-hidden
                className={`mx-2 w-8 xl:w-12 ${
                  i <= step
                    ? "h-px bg-primary"
                    : "border-t border-dashed border-border"
                }`}
              />
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              className={`flex items-center gap-2 rounded-full transition-opacity ${
                clickable ? "hover:opacity-70" : ""
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : current
                      ? "border-2 border-primary text-primary"
                      : "border text-muted-foreground"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-sm ${
                  current
                    ? "font-medium text-foreground"
                    : done || clickable
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {s.title}
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}

export function TradeForm({
  form,
  onChange,
  step,
  onBack,
  onNext,
  onLoadExample,
  onReset,
  showAdvanced,
  onToggleAdvanced,
}: TradeFormProps) {
  const remaining = STEP_FIELDS[step].filter(
    (key) => form[key].trim() === "",
  ).length;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-5 py-10 lg:py-14">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground lg:hidden">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="flex gap-2 lg:ml-auto">
          <Button variant="outline" size="sm" onClick={onLoadExample}>
            Load example
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5 lg:hidden">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {STEPS[step].title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {STEPS[step].blurb}
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        {step === 0 ? (
          <>
            <Field
              id="balance"
              label="Account balance ($)"
              hint="Your balance with your broker — sets every risk limit"
            >
              <Input
                id="balance"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="600"
                value={form.accountBalance}
                onChange={(e) => onChange({ accountBalance: e.target.value })}
              />
            </Field>

            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={onToggleAdvanced}
            >
              {showAdvanced ? "Hide" : "Show"} advanced settings
            </button>

            {showAdvanced ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="risk" label="Risk per trade (%)" hint="2% max">
                  <Input
                    id="risk"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    inputMode="decimal"
                    value={form.riskTolerance}
                    onChange={(e) => onChange({ riskTolerance: e.target.value })}
                  />
                </Field>
                <Field id="buffer" label="Target buffer (%)" hint="75 to 80%">
                  <Input
                    id="buffer"
                    type="number"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={form.targetBuffer}
                    onChange={(e) => onChange({ targetBuffer: e.target.value })}
                  />
                </Field>
                <Field
                  id="openRisk"
                  label="Risk in open trades ($)"
                  hint="For the 6% rule — 0 if this is your only trade"
                >
                  <Input
                    id="openRisk"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.openTradeRisk}
                    onChange={(e) => onChange({ openTradeRisk: e.target.value })}
                  />
                </Field>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="direction" label="Direction">
                <SegmentedControl
                  aria-label="Direction"
                  value={form.direction}
                  options={[
                    { value: "long", label: "Buy long" },
                    { value: "short", label: "Sell short" },
                  ]}
                  onChange={(direction) => onChange({ direction })}
                />
              </Field>
              <Field
                id="timeframe"
                label="Income objective"
                hint="Sets the stop buffer: 2% or 10% of ATR"
              >
                <SegmentedControl
                  aria-label="Income objective"
                  value={form.timeframe}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly +" },
                  ]}
                  onChange={(timeframe) => onChange({ timeframe })}
                />
              </Field>
            </div>
            <Field id="trend" label="Trend">
              <SegmentedControl
                aria-label="Trend"
                value={form.trend}
                options={[
                  { value: "uptrend", label: "Uptrend" },
                  { value: "sideways", label: "Sideways" },
                  { value: "downtrend", label: "Downtrend" },
                ]}
                onChange={(trend) => onChange({ trend })}
              />
            </Field>
            <Field
              id="atr"
              label="Daily ATR ($)"
              hint="From finviz.com — 14-day average true range"
            >
              <PriceInput
                id="atr"
                placeholder="5.93"
                value={form.atr}
                onChange={(atr) => onChange({ atr })}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="curveLow"
                label="Curve low ($)"
                hint="HTF demand zone distal line"
              >
                <PriceInput
                  id="curveLow"
                  value={form.curveLow}
                  onChange={(curveLow) => onChange({ curveLow })}
                />
              </Field>
              <Field
                id="curveHigh"
                label="Curve high ($)"
                hint="HTF supply zone distal line"
              >
                <PriceInput
                  id="curveHigh"
                  value={form.curveHigh}
                  onChange={(curveHigh) => onChange({ curveHigh })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="entryProximal"
                label="Entry proximal ($)"
                hint="The line you enter at"
              >
                <PriceInput
                  id="entryProximal"
                  value={form.entryProximal}
                  onChange={(entryProximal) => onChange({ entryProximal })}
                />
              </Field>
              <Field
                id="entryDistal"
                label="Entry distal ($)"
                hint="The far edge — your stop hides behind it"
              >
                <PriceInput
                  id="entryDistal"
                  value={form.entryDistal}
                  onChange={(entryDistal) => onChange({ entryDistal })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="targetProximal"
                label="Target proximal ($)"
                hint="Near edge of the zone you exit into"
              >
                <PriceInput
                  id="targetProximal"
                  value={form.targetProximal}
                  onChange={(targetProximal) => onChange({ targetProximal })}
                />
              </Field>
              <Field id="targetDistal" label="Target distal ($)">
                <PriceInput
                  id="targetDistal"
                  value={form.targetDistal}
                  onChange={(targetDistal) => onChange({ targetDistal })}
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-xs text-muted-foreground">
              Score the entry zone from your own analysis per the trade
              methodology.
            </p>
            <Field id="strength" label="Strength">
              <RatingChips
                aria-label="Strength"
                value={Number(form.strength)}
                max={JUDGED_MAX.strength}
                onChange={(v) => onChange({ strength: String(v) })}
              />
            </Field>
            <Field id="time" label="Time">
              <RatingChips
                aria-label="Time"
                value={Number(form.time)}
                max={JUDGED_MAX.time}
                onChange={(v) => onChange({ time: String(v) })}
              />
            </Field>
            <Field id="freshness" label="Freshness">
              <RatingChips
                aria-label="Freshness"
                value={Number(form.freshness)}
                max={JUDGED_MAX.freshness}
                onChange={(v) => onChange({ freshness: String(v) })}
              />
            </Field>
          </>
        ) : null}
      </div>

      {/* On mobile this is a full-width action bar pinned above the score
          bar; on large screens it sits in the normal content flow. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={step === 0}
          className={step === 0 ? "hidden lg:inline-flex lg:invisible" : ""}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={remaining > 0}
          size="lg"
          className="flex-1 lg:flex-none"
        >
          {remaining > 0
            ? `${remaining} field${remaining === 1 ? "" : "s"} left`
            : isLast
              ? "See my trade"
              : "Next"}
        </Button>
      </div>
    </div>
  );
}
