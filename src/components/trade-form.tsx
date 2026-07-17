"use client";

import { Fragment, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  MoveRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { FormState } from "@/components/trade-builder-app";
import { JUDGED_MAX } from "@/lib/trade-builder";
import { DISCLAIMER } from "@/lib/copy";
import { validateZones } from "@/lib/validate-zones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingChips } from "@/components/rating-chips";
import { SegmentedControl } from "@/components/segmented-control";

export const STEPS = [
  { title: "Account", blurb: "How much you're working with" },
  { title: "Trade", blurb: "What you're trading and which way" },
  { title: "Zones", blurb: "The price lines from your chart" },
  { title: "Your read", blurb: "Score the zone quality yourself" },
] as const;

// Required fields per step; Next stays disabled until these are filled.
const STEP_FIELDS: (keyof FormState)[][] = [
  ["accountBalance"],
  ["atr"],
  [
    "curveLow",
    "curveHigh",
    "demandHigh",
    "demandLow",
    "supplyHigh",
    "supplyLow",
  ],
  [],
];

// First step with an empty required field (or STEPS.length if all filled).
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
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

// `group` fields wrap a radiogroup (a div, which <label htmlFor> can't target),
// so the label carries an id for the control to point at via aria-labelledby.
function Field({
  id,
  label,
  hint,
  group,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  group?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label id={`${id}-label`} htmlFor={group ? undefined : id}>
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// Digits and one decimal point only; this is what we store, so Number() stays clean.
function sanitizeNumber(input: string): string {
  let cleaned = input.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot !== -1) {
    cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
  }
  return cleaned;
}

// Thousands separators for display only.
function formatNumber(raw: string): string {
  if (raw === "") return "";
  const [intPart, decPart] = raw.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

// type="text" because type="number" refuses to render commas.
function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      placeholder={placeholder}
      value={formatNumber(value)}
      onChange={(e) => onChange(sanitizeNumber(e.target.value))}
    />
  );
}

// A price input wired to a Field, with an optional geometry error.
function PriceField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <NumberInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        invalid={!!error}
      />
    </Field>
  );
}

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
                    : "border-t border-dotted border-neutral-300 dark:border-neutral-600"
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
                  done || current
                    ? "bg-primary text-primary-foreground"
                    : "bg-neutral-200 text-muted-foreground dark:bg-neutral-700"
                }`}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-sm ${
                  done || current
                    ? "font-medium text-foreground"
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
  showAdvanced,
  onToggleAdvanced,
}: TradeFormProps) {
  const remaining = STEP_FIELDS[step].filter(
    (key) => form[key].trim() === "",
  ).length;
  const isLast = step === STEPS.length - 1;
  const long = form.direction === "long";

  // Zone geometry errors block advancing once the user is on the Zones step
  // (index 2) or beyond, so a nonsensical setup can't reach the results.
  const zoneErrors = validateZones(form);
  const hasZoneErrors = Object.keys(zoneErrors).length > 0;
  const blockedByZones = hasZoneErrors && step >= 2;
  const disableNext = remaining > 0 || blockedByZones;

  // Move focus to the new step's heading so keyboard and screen-reader users
  // aren't stranded on the old Next button. Skip the initial mount.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-5 py-10 lg:py-14">
      <p className="text-xs font-medium text-muted-foreground lg:hidden">
        Step {step + 1} of {STEPS.length}
      </p>

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
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight outline-none"
        >
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
              hint="Your balance with your broker, used for all risk limits"
            >
              <NumberInput
                id="balance"
                placeholder="600"
                value={form.accountBalance}
                onChange={(accountBalance) => onChange({ accountBalance })}
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
                  hint="For the 6% rule. Leave 0 if this is your only trade"
                >
                  <NumberInput
                    id="openRisk"
                    value={form.openTradeRisk}
                    onChange={(openTradeRisk) => onChange({ openTradeRisk })}
                  />
                </Field>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="direction" label="Direction" group>
                <SegmentedControl
                  aria-labelledby="direction-label"
                  value={form.direction}
                  options={[
                    {
                      value: "long",
                      label: "Buy long",
                      icon: TrendingUp,
                      accent: "green",
                    },
                    {
                      value: "short",
                      label: "Sell short",
                      icon: TrendingDown,
                      accent: "red",
                    },
                  ]}
                  onChange={(direction) => onChange({ direction })}
                />
              </Field>
              <Field
                id="timeframe"
                label="Income objective"
                hint="Sets the stop buffer: 2% or 10% of ATR"
                group
              >
                <SegmentedControl
                  aria-labelledby="timeframe-label"
                  value={form.timeframe}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly +" },
                  ]}
                  onChange={(timeframe) => onChange({ timeframe })}
                />
              </Field>
            </div>
            <Field id="trend" label="Trend" group>
              <SegmentedControl
                aria-labelledby="trend-label"
                value={form.trend}
                options={[
                  {
                    value: "uptrend",
                    label: "Uptrend",
                    icon: TrendingUp,
                    accent: "green",
                  },
                  { value: "sideways", label: "Sideways", icon: MoveRight },
                  {
                    value: "downtrend",
                    label: "Downtrend",
                    icon: TrendingDown,
                    accent: "red",
                  },
                ]}
                onChange={(trend) => onChange({ trend })}
              />
            </Field>
            <Field
              id="atr"
              label="Daily ATR ($)"
              hint="From finviz.com (14-day average true range)"
            >
              <NumberInput
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
              <PriceField
                id="curveLow"
                label="Curve low ($)"
                hint="HTF demand zone distal line"
                value={form.curveLow}
                onChange={(curveLow) => onChange({ curveLow })}
              />
              <PriceField
                id="curveHigh"
                label="Curve high ($)"
                hint="HTF supply zone distal line"
                value={form.curveHigh}
                onChange={(curveHigh) => onChange({ curveHigh })}
                error={zoneErrors.curveHigh}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {long
                ? "You enter at the demand zone and target the supply zone."
                : "You enter at the supply zone and target the demand zone."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="demandHigh"
                label="Demand high ($)"
                hint={`Top of the demand zone${long ? " (your entry)" : " (your target)"}`}
                value={form.demandHigh}
                onChange={(demandHigh) => onChange({ demandHigh })}
                error={zoneErrors.demandHigh}
              />
              <PriceField
                id="demandLow"
                label="Demand low ($)"
                hint="Bottom of the demand zone"
                value={form.demandLow}
                onChange={(demandLow) => onChange({ demandLow })}
                error={zoneErrors.demandLow}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="supplyHigh"
                label="Supply high ($)"
                hint="Top of the supply zone"
                value={form.supplyHigh}
                onChange={(supplyHigh) => onChange({ supplyHigh })}
                error={zoneErrors.supplyHigh}
              />
              <PriceField
                id="supplyLow"
                label="Supply low ($)"
                hint={`Bottom of the supply zone${long ? " (your target)" : " (your entry)"}`}
                value={form.supplyLow}
                onChange={(supplyLow) => onChange({ supplyLow })}
                error={zoneErrors.supplyLow}
              />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-xs text-muted-foreground">
              Score the entry zone from your own analysis per the trade
              methodology.
            </p>
            <Field
              id="strength"
              label="Strength"
              hint="How sharply price rejected the zone"
              group
            >
              <RatingChips
                aria-labelledby="strength-label"
                value={Number(form.strength)}
                max={JUDGED_MAX.strength}
                lowLabel="Weak move"
                highLabel="Strong move"
                onChange={(v) => onChange({ strength: String(v) })}
              />
            </Field>
            <Field
              id="time"
              label="Time"
              hint="How little time price spent at the zone"
              group
            >
              <RatingChips
                aria-labelledby="time-label"
                value={Number(form.time)}
                max={JUDGED_MAX.time}
                lowLabel="Lingered"
                highLabel="In and out"
                onChange={(v) => onChange({ time: String(v) })}
              />
            </Field>
            <Field
              id="freshness"
              label="Freshness"
              hint="How untouched the zone is since it formed"
              group
            >
              <RatingChips
                aria-labelledby="freshness-label"
                value={Number(form.freshness)}
                max={JUDGED_MAX.freshness}
                lowLabel="Retested"
                highLabel="Untested"
                onChange={(v) => onChange({ freshness: String(v) })}
              />
            </Field>
          </>
        ) : null}
      </div>

      {/* On the last step the erroring zone fields aren't visible, so point
          the user back to fix them. */}
      {isLast && hasZoneErrors ? (
        <p className="mt-6 text-center text-xs text-destructive">
          Some zone values are inconsistent. Go back to Zones to fix the
          highlighted fields.
        </p>
      ) : null}

      {/* On mobile the footer sits behind the fixed action bar, so repeat it
          inline here for small screens. */}
      <p className="mt-10 text-center text-xs text-muted-foreground lg:hidden">
        {DISCLAIMER}
      </p>

      {/* Fixed action bar on mobile; in normal flow on large screens. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background px-5 py-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={step === 0}
          // -ml-2.5 cancels the button padding so "Back" lines up with the
          // field labels above; the mobile bar keeps its inset.
          className={`lg:-ml-2.5 ${step === 0 ? "hidden lg:inline-flex lg:invisible" : ""}`}
        >
          <ChevronLeft aria-hidden />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={disableNext}
          size="lg"
          className="flex-1 lg:flex-none"
        >
          {remaining > 0
            ? `${remaining} field${remaining === 1 ? "" : "s"} left`
            : blockedByZones
              ? "Check the highlighted values"
              : isLast
                ? "See my trade"
                : "Next"}
          {!disableNext ? <ArrowRight aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
