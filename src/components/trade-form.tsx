"use client";

import { Fragment, forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  MoveRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { FormState } from "@/components/trade-builder-app";
import {
  TARGET_BUFFER_MAX_PCT,
  TARGET_BUFFER_MIN_PCT,
  curveScore,
  deriveZoneLines,
  isXltMatrixCell,
  locateOnCurve,
  profitZoneRatio,
  profitZoneScore,
  trendScore,
} from "@/lib/trade-builder";
import { DISCLAIMER } from "@/lib/copy";
import { clampNumericString } from "@/lib/utils";
import { validateZones } from "@/lib/validate-zones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/segmented-control";
import { CurveVideoDialog } from "@/components/curve-video-dialog";
import { TrendVideoDialog } from "@/components/trend-video-dialog";
import { ZoningVideoDialog } from "@/components/zoning-video-dialog";
import { DecisionMatrixDialog } from "@/components/decision-matrix-dialog";
import { ChartTutorialButton } from "@/components/chart-tutorial-dialog";
import { OddsEnhancerVideoDialog } from "@/components/odds-enhancer-video-dialog";
import { StrengthReference } from "@/components/strength-reference";
import { TimeReference } from "@/components/time-reference";
import { FreshnessReference } from "@/components/freshness-reference";
import { Analytics } from "@vercel/analytics/next";

interface TradeFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  step: number;
  onBack: () => void;
  onNext: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export const STEPS = [
  { title: "Pre-steps", blurb: "Your account and the stock's volatility" },
  { title: "Curve", blurb: "Set the curve on your high time frame" },
  { title: "Trend", blurb: "Check the trend on your intermediary time frame" },
  { title: "Zones", blurb: "Mark the supply and demand zones on your low time frame" },
  { title: "Score", blurb: "Score the zone structure" },
] as const;

const STEP_FIELDS: (keyof FormState)[][] = [
  ["accountBalance", "atr"],
  ["curveLow", "curveHigh"],
  [],
  ["demandHigh", "demandLow", "supplyHigh", "supplyLow"],
  ["strength", "time", "freshness"],
];

export function firstIncompleteStep(form: FormState): number {
  for (let i = 0; i < STEP_FIELDS.length; i++) {
    if (STEP_FIELDS[i].some((key) => form[key].trim() === "")) return i;
  }
  return STEPS.length;
}

const ScorePopupButton = forwardRef<HTMLButtonElement, {
  id: string;
  labelId: string;
  value: string;
  onClick: () => void;
  popup: React.ReactNode;
  popupRef: React.RefObject<HTMLDivElement | null>;
  popupClassName?: string;
}>(({ id, labelId, value, onClick, popup, popupRef, popupClassName }, ref) => {
  const [popupTop, setPopupTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!popup || typeof ref === "function" || !ref?.current) return;

    const updatePopupPosition = () => {
      const buttonRect = ref.current?.getBoundingClientRect();
      if (buttonRect) setPopupTop(buttonRect.bottom + 8);
    };

    updatePopupPosition();
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [popup, ref]);

  return (
    <div className="relative justify-self-start">
      <button
        ref={ref}
        id={id}
        type="button"
        aria-labelledby={labelId}
        onClick={onClick}
        className="flex h-9 w-11 items-center justify-center rounded-lg border border-input bg-background px-1 text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>{value}</span>
      </button>
      {popup ? (
        <div ref={popupRef} style={{ top: popupTop === null ? "50%" : `${popupTop}px` }} className={`fixed left-1/2 z-100 w-[min(39.5rem,calc(100vw-2.5rem))] -translate-x-1/2 shadow-xl ${popupClassName ?? ""}`}>
          {popup}
        </div>
      ) : null}
    </div>
  );
});
ScorePopupButton.displayName = "ScorePopupButton";

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

// Digits and one decimal point only (plus a single leading minus when
// allowed); this is what we store, so Number() stays clean. Without
// allowNegative, a leading "-" is silently dropped rather than preserved,
// since prices/ATR/etc. can't be negative and shouldn't error either.
function sanitizeNumber(input: string, allowNegative = false): string {
  const negative = allowNegative && input.trimStart().startsWith("-");
  let cleaned = input.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot !== -1) {
    cleaned = cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
  }
  return negative ? `-${cleaned}` : cleaned;
}

// Thousands separators for display only.
function formatNumber(raw: string): string {
  if (raw === "") return "";
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [intPart, decPart] = unsigned.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  return negative ? `-${formatted}` : formatted;
}

// Commas are the only characters formatNumber inserts, so caret position can
// be tracked as "how many non-comma characters sit before it" and reapplied
// after reformatting shifts the commas around.
function nonCommaCountBefore(display: string, index: number): number {
  let count = 0;
  for (let i = 0; i < index; i++) if (display[i] !== ",") count++;
  return count;
}
function indexAtNonCommaCount(display: string, count: number): number {
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (seen === count) return i;
    if (display[i] !== ",") seen++;
  }
  return display.length;
}

// type="text" because type="number" refuses to render commas.
function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  allowNegative,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  allowNegative?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const display = formatNumber(value);

  // Keyed on an edit counter, not on `display`: deleting a comma sanitizes
  // back to the value already stored (e.g. "1,234" -> delete "," -> "1234",
  // which is what "1,234" already was), so `display` recomputes to the same
  // string and a `[display]` dependency would skip the effect. React still
  // force-restores the DOM value in that case (since the live DOM value
  // briefly diverged), which resets the caret to the end. Running on every
  // edit, regardless of whether the string actually changed, fixes that.
  const [editCount, setEditCount] = useState(0);
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return;
    const index = indexAtNonCommaCount(display, pendingCaret.current);
    inputRef.current.setSelectionRange(index, index);
    pendingCaret.current = null;
    // display is read fresh on each run; editCount alone drives re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCount]);

  return (
    <Input
      id={id}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      placeholder={placeholder}
      value={display}
      onChange={(e) => {
        const caret = e.target.selectionStart ?? e.target.value.length;
        pendingCaret.current = nonCommaCountBefore(e.target.value, caret);
        setEditCount((n) => n + 1);
        onChange(sanitizeNumber(e.target.value, allowNegative));
      }}
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
                className={`mx-2 w-8 xl:w-12 ${i <= step
                  ? "h-px bg-primary"
                  : "border-t border-dotted border-neutral-300 dark:border-neutral-600"
                  }`}
              />
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              className={`flex items-center gap-2 rounded-full transition-opacity ${clickable ? "hover:opacity-70" : ""
                }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done || current
                  ? "bg-primary text-primary-foreground"
                  : "bg-neutral-200 text-muted-foreground dark:bg-neutral-700"
                  }`}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-sm ${done || current
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
  const computedScores = (() => {
    const numbers = [
      Number(form.curveLow),
      Number(form.curveHigh),
      Number(form.demandHigh),
      Number(form.demandLow),
      Number(form.supplyHigh),
      Number(form.supplyLow),
    ];
    if (numbers.some((value) => !Number.isFinite(value))) return null;

    const [curveLow, curveHigh, demandHigh, demandLow, supplyHigh, supplyLow] = numbers;
    if (curveHigh <= curveLow) return null;
    const lines = deriveZoneLines(
      { demandHigh, demandLow, supplyHigh, supplyLow },
      form.direction,
    );
    const curve = locateOnCurve(lines.entryProximal, curveLow, curveHigh);
    const ratio = profitZoneRatio(
      lines.entryProximal,
      lines.entryDistal,
      lines.targetProximal,
    );
    return {
      trend: trendScore(form.trend, form.direction),
      curve: curveScore(curve, form.direction),
      profitZone: profitZoneScore(ratio),
    };
  })();
  const allEnhancerScore = computedScores &&
    form.strength !== "" &&
    form.time !== "" &&
    form.freshness !== ""
    ? computedScores.trend +
    computedScores.curve +
    computedScores.profitZone +
    Number(form.strength) +
    Number(form.time) +
    Number(form.freshness)
    : null;

  const [showStrengthReference, setShowStrengthReference] = useState(false);
  const [showTimeReference, setShowTimeReference] = useState(false);
  const [showFreshnessReference, setShowFreshnessReference] = useState(false);
  const strengthButtonRef = useRef<HTMLButtonElement>(null);
  const strengthPopupRef = useRef<HTMLDivElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const timePopupRef = useRef<HTMLDivElement>(null);
  const freshnessButtonRef = useRef<HTMLButtonElement>(null);
  const freshnessPopupRef = useRef<HTMLDivElement>(null);
  const remaining = STEP_FIELDS[step].filter(
    (key) => form[key].trim() === "",
  ).length;
  const isLast = step === STEPS.length - 1;
  const long = form.direction === "long";

  useEffect(() => {
    if (!showStrengthReference) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !strengthButtonRef.current?.contains(target) &&
        !strengthPopupRef.current?.contains(target)
      ) {
        setShowStrengthReference(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [showStrengthReference]);

  useEffect(() => {
    if (!showTimeReference) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!timeButtonRef.current?.contains(target) && !timePopupRef.current?.contains(target)) {
        setShowTimeReference(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [showTimeReference]);

  useEffect(() => {
    if (!showFreshnessReference) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!freshnessButtonRef.current?.contains(target) && !freshnessPopupRef.current?.contains(target)) {
        setShowFreshnessReference(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [showFreshnessReference]);

  // Geometry errors block advancing on the step that owns the offending field:
  // a bad curve on the Curve step (1), zone-geometry errors on the Zones
  // step (3). Any lingering error also blocks the final submit, since the
  // stepper lets a user jump ahead once the required fields are filled.
  const zoneErrors = validateZones(form);
  const hasZoneErrors = Object.keys(zoneErrors).length > 0;
  const curveStepError = !!zoneErrors.curveLow;
  const zoneStepError = !!(
    zoneErrors.demandHigh ||
    zoneErrors.demandLow ||
    zoneErrors.supplyHigh ||
    zoneErrors.supplyLow
  );
  const xltCellKey = (() => {
    if (hasZoneErrors) return null;
    const curveLow = Number(form.curveLow);
    const curveHigh = Number(form.curveHigh);
    const entryProximal = Number(
      form.direction === "long" ? form.demandHigh : form.supplyLow,
    );
    if (
      !Number.isFinite(curveLow) ||
      !Number.isFinite(curveHigh) ||
      !Number.isFinite(entryProximal) ||
      curveHigh <= curveLow
    ) {
      return null;
    }
    const zoneType = form.direction === "long" ? "demand" : "supply";
    const curve = locateOnCurve(entryProximal, curveLow, curveHigh);
    return isXltMatrixCell(zoneType, curve, form.trend)
      ? `${zoneType}:${curve}:${form.trend}`
      : null;
  })();
  const missingXltAcknowledgement =
    step === 3 &&
    xltCellKey !== null &&
    form.xltAcknowledgement !== xltCellKey;
  const blockedByZones =
    (step === 1 && curveStepError) ||
    (step === 3 && zoneStepError) ||
    (isLast && hasZoneErrors);
  const disableNext = remaining > 0 || blockedByZones || missingXltAcknowledgement;
  // Name the step(s) that actually hold the error, so the last-step notice
  // points where the highlighted field really is.
  const errorSteps = [
    curveStepError ? "Curve" : null,
    zoneStepError ? "Zones" : null,
  ]
    .filter(Boolean)
    .join(" and ");

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
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"
              }`}
          />
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight outline-none"
          >
            {STEPS[step].title}
          </h2>
          {step === 1 ? (
            <CurveVideoDialog />
          ) : step === 2 ? (
            <TrendVideoDialog />
          ) : step === 3 ? (
            <ZoningVideoDialog />
          ) : step === 4 ? (
            <OddsEnhancerVideoDialog />
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {STEPS[step].blurb}
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        {step === 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
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
                  allowNegative
                />
              </Field>
              <Field
                id="atr"
                label="Daily ATR ($)"
                hint="From finviz.com (14-day Average True Range)"
              >
                <NumberInput
                  id="atr"
                  placeholder="5.93"
                  value={form.atr}
                  onChange={(atr) => onChange({ atr })}
                />
              </Field>
            </div>
            <Field
              id="timeframe"
              label="Income objective"
              hint="Sets the stop buffer: 2% or 10% of Daily ATR"
              group
            >
              <SegmentedControl
                aria-labelledby="timeframe-label"
                value={form.timeframe}
                options={[
                  { value: "daily", label: "Daily (-)" },
                  { value: "weekly", label: "Weekly (+)" },
                ]}
                onChange={(timeframe) => onChange({ timeframe })}
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
              <>
                <Field
                  id="targetMode"
                  label="Target mode"
                  hint={`Percentage buffer, a mechanical 3:1, or Auto (the better of a ${TARGET_BUFFER_MAX_PCT}% buffer and 3:1)`}
                  group
                >
                  <SegmentedControl
                    aria-labelledby="targetMode-label"
                    value={form.targetMode}
                    options={[
                      { value: "percent", label: "Percentage" },
                      // Read aloud, "3:1 R:R" becomes "three colon one R colon
                      // R", so the spoken name spells the intent out — but keeps
                      // the visible string first (WCAG 2.5.3: the accessible
                      // name must contain the visible label so speech input can
                      // match what the user sees).
                      {
                        value: "ratio",
                        label: "3:1 R:R",
                        ariaLabel: "3:1 R:R, 3 to 1 reward to risk",
                      },
                      { value: "auto", label: "Auto" },
                    ]}
                    onChange={(targetMode) => onChange({ targetMode })}
                  />
                </Field>
                {form.targetMode === "percent" ? (
                  // Collapsed for 3:1/Auto (per Eugene): auto checks the
                  // 75-80% range on its own rather than this field's value,
                  // and 3:1 doesn't use a percentage at all, so the control
                  // has nothing to offer in either mode. Full width and above
                  // the grid below, so its absence never reshuffles the other
                  // two fields' positions.
                  <Field
                    id="buffer"
                    label="Target buffer (%)"
                    hint={`Between ${TARGET_BUFFER_MIN_PCT}% and ${TARGET_BUFFER_MAX_PCT}%`}
                  >
                    <Input
                      id="buffer"
                      type="number"
                      min={TARGET_BUFFER_MIN_PCT}
                      max={TARGET_BUFFER_MAX_PCT}
                      inputMode="decimal"
                      value={form.targetBuffer}
                      onChange={(e) => onChange({ targetBuffer: e.target.value })}
                      onBlur={(e) =>
                        onChange({
                          targetBuffer: clampNumericString(
                            e.target.value,
                            TARGET_BUFFER_MIN_PCT,
                            TARGET_BUFFER_MAX_PCT,
                          ),
                        })
                      }
                    />
                  </Field>
                ) : null}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="risk"
                    label="Risk per trade (%)"
                    hint="Up to 2%, to preserve the account"
                  >
                    <Input
                      id="risk"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      inputMode="decimal"
                      value={form.riskTolerance}
                      onChange={(e) => onChange({ riskTolerance: e.target.value })}
                      onBlur={(e) =>
                        onChange({
                          riskTolerance: clampNumericString(e.target.value, 0, 2),
                        })
                      }
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
              </>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="curveHigh"
                label="Curve high ($)"
                hint="HTF supply zone distal line"
                value={form.curveHigh}
                onChange={(curveHigh) => onChange({ curveHigh })}
              />
              <PriceField
                id="curveLow"
                label="Curve low ($)"
                hint="HTF demand zone distal line"
                value={form.curveLow}
                onChange={(curveLow) => onChange({ curveLow })}
                error={zoneErrors.curveLow}
              />
            </div>
            <div className="flex justify-center">
              <ChartTutorialButton
                direction={form.direction}
                curveHigh={form.curveHigh}
                curveLow={form.curveLow}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
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
        ) : null}

        {step === 3 ? (
          <>
            {/* Zone lines top-down, the way they read on the chart: supply on
                top (distal above proximal), then demand below. The top-down
                reading is exact on mobile; side by side each row reads
                left-to-right, so the zone order holds but the distal/proximal
                columns swap between the two rows. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="supplyHigh"
                label="Supply distal ($)"
                hint="Top edge of the supply zone"
                value={form.supplyHigh}
                onChange={(supplyHigh) => onChange({ supplyHigh })}
                error={zoneErrors.supplyHigh}
              />
              <PriceField
                id="supplyLow"
                label="Supply proximal ($)"
                hint="Bottom edge of the supply zone"
                value={form.supplyLow}
                onChange={(supplyLow) => onChange({ supplyLow })}
                error={zoneErrors.supplyLow}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="demandHigh"
                label="Demand proximal ($)"
                hint="Top edge of the demand zone"
                value={form.demandHigh}
                onChange={(demandHigh) => onChange({ demandHigh })}
                error={zoneErrors.demandHigh}
              />
              <PriceField
                id="demandLow"
                label="Demand distal ($)"
                hint="Bottom edge of the demand zone"
                value={form.demandLow}
                onChange={(demandLow) => onChange({ demandLow })}
                error={zoneErrors.demandLow}
              />
            </div>
            <div className="flex justify-center">
              <DecisionMatrixDialog
                curveLow={form.curveLow}
                curveHigh={form.curveHigh}
                demandProximal={form.demandHigh}
                supplyProximal={form.supplyLow}
                trend={form.trend}
              />
            </div>
            {/* Direction comes after the zone lines: mark the zones as they
                appear on the chart, then decide which way to trade them. */}
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
            <p className="text-xs text-muted-foreground">
              {long
                ? "You enter at the demand zone and target the supply zone."
                : "You enter at the supply zone and target the demand zone."}
            </p>
            {xltCellKey ? (
              <Label className="items-start rounded-lg border p-3 leading-snug">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  checked={form.xltAcknowledgement === xltCellKey}
                  onChange={(event) =>
                    onChange({
                      xltAcknowledgement: event.target.checked ? xltCellKey : "",
                    })
                  }
                />
                <span>I verified the XLT criteria for this setup.</span>
              </Label>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem] items-center gap-x-3 gap-y-3">
              <div className="text-xs font-medium text-muted-foreground">Odds Enhancer</div>
              <div className="text-center text-xs font-medium text-muted-foreground">Score</div>
              <div className="text-center text-xs font-medium text-muted-foreground">Max</div>

              <Label id="strength-label">Strength</Label>
              <ScorePopupButton
                ref={strengthButtonRef}
                id="strength"
                labelId="strength-label"
                value={form.strength}
                onClick={() => setShowStrengthReference(true)}
                popup={showStrengthReference ? <StrengthReference direction={form.direction} selected={form.strength === "" ? null : Number(form.strength)} onSelect={(strength) => { onChange({ strength: String(strength) }); setShowStrengthReference(false); }} /> : null}
                popupRef={strengthPopupRef}
              />
              <div className="text-center font-mono text-sm tabular-nums">2</div>

              <Label id="time-label">Time</Label>
              <ScorePopupButton
                ref={timeButtonRef}
                id="time"
                labelId="time-label"
                value={form.time}
                onClick={() => setShowTimeReference(true)}
                popup={showTimeReference ? <TimeReference direction={form.direction} selected={form.time === "" ? null : Number(form.time)} onSelect={(time) => { onChange({ time: String(time) }); setShowTimeReference(false); }} /> : null}
                popupRef={timePopupRef}
                popupClassName="w-[min(34rem,calc(100vw-2.5rem))]"
              />
              <div className="text-center font-mono text-sm tabular-nums">1</div>

              <Label id="freshness-label">Freshness</Label>
              <ScorePopupButton
                ref={freshnessButtonRef}
                id="freshness"
                labelId="freshness-label"
                value={form.freshness}
                onClick={() => setShowFreshnessReference(true)}
                popup={showFreshnessReference ? <FreshnessReference direction={form.direction} selected={form.freshness === "" ? null : Number(form.freshness)} onSelect={(freshness) => { onChange({ freshness: String(freshness) }); setShowFreshnessReference(false); }} /> : null}
                popupRef={freshnessPopupRef}
              />
              <div className="text-center font-mono text-sm tabular-nums">2</div>

              <div className="col-span-3 mt-1 border-t pt-3 text-xs font-medium text-muted-foreground">
                Auto-scored odds enhancers
              </div>

              <span className="text-sm text-muted-foreground">Trend</span>
              <output className="text-center font-mono text-sm tabular-nums" aria-label="Trend score">
                {computedScores?.trend ?? "-"}
              </output>
              <div className="text-center font-mono text-sm tabular-nums">2</div>

              <span className="text-sm text-muted-foreground">Curve</span>
              <output className="text-center font-mono text-sm tabular-nums" aria-label="Curve score">
                {computedScores?.curve ?? "-"}
              </output>
              <div className="text-center font-mono text-sm tabular-nums">1</div>

              <span className="text-sm text-muted-foreground">Profit zone</span>
              <output className="text-center font-mono text-sm tabular-nums" aria-label="Profit zone score">
                {computedScores?.profitZone ?? "-"}
              </output>
              <div className="text-center font-mono text-sm tabular-nums">2</div>

              <span className="col-span-3 mt-1 grid grid-cols-[minmax(0,1fr)_3rem_4rem] items-center gap-x-3 border-t pt-3 font-medium">
                <span>Total score</span>
                <output className="text-center font-mono text-sm tabular-nums" aria-label="Total odds-enhancer score">
                  {allEnhancerScore ?? "-"}
                </output>
                <span className="text-center font-mono text-sm tabular-nums">10</span>
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* On the last step the erroring zone fields aren't visible, so point
          the user back to fix them. */}
      {isLast && hasZoneErrors ? (
        <p className="mt-6 text-center text-xs text-destructive">
          Some values are inconsistent. Go back to {errorSteps} to fix the
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
              : missingXltAcknowledgement
                ? "Confirm XLT criteria"
                : isLast
                  ? "See my trade"
                  : "Next"}
          {!disableNext ? <ArrowRight aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
