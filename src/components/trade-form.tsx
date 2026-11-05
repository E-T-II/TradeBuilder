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

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeftRight,
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
  locateOnCurve,
  meetsProfitRatio,
} from "@/lib/trade-builder";
import {
  parseXltChecked,
  serializeXltChecked,
  xltScenario,
} from "@/lib/xlt-criteria";
import { Disclaimer } from "@/lib/copy";
import { clampNumericString } from "@/lib/utils";
import { validateZones } from "@/lib/validate-zones";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ZoneScorecard, computeZoneScores, zoneTotal } from "@/components/zone-scorecard";
import { XltChecklistDialog } from "@/components/xlt-checklist-dialog";
import { useLanguage } from "@/components/language-provider";
import { CurrencyAmountHint } from "@/components/currency-note";

interface TradeFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  step: number;
  onBack: () => void;
  onNext: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  autoOpenTradeRisk: boolean;
  onToggleAutoOpenTradeRisk: () => void;
}

export const STEPS = [
  { title: "Pre-steps", blurb: "Your account and the stock's volatility" },
  { title: "Curve", blurb: "Set the curve on your high time frame" },
  { title: "Trend", blurb: "Check the trend on your intermediary time frame" },
  { title: "Zones", blurb: "Mark the supply and demand zones on your low time frame" },
  { title: "Score", blurb: "Score the zone structure" },
] as const;

const STEP_FIELDS: (keyof FormState)[][] = [
  ["ticker", "accountBalance", "atr"],
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
  hint?: React.ReactNode;
  group?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const { text: tx } = useLanguage();
  return (
    <div className="space-y-1.5">
      <Label id={`${id}-label`} htmlFor={group ? undefined : id}>
        {tx(label)}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {tx(error)}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{tx(hint)}</p>
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
  disabled,
  formatOnBlur,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
  allowNegative?: boolean;
  disabled?: boolean;
  /** Rewrites the value to two decimal places on blur, e.g. "22" -> "22.00". */
  formatOnBlur?: boolean;
}) {
  const { text: tx } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const monetary = ["balance", "atr", "openRisk", "curveHigh", "curveLow", "supplyHigh", "supplyLow", "demandHigh", "demandLow"].includes(id);
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
    <>
    <Input
      id={id}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      placeholder={tx(placeholder)}
      value={display}
      disabled={disabled}
      onChange={(e) => {
        const caret = e.target.selectionStart ?? e.target.value.length;
        pendingCaret.current = nonCommaCountBefore(e.target.value, caret);
        setEditCount((n) => n + 1);
        onChange(sanitizeNumber(e.target.value, allowNegative));
      }}
      onBlur={
        formatOnBlur
          ? () => {
            const n = Number(value);
            if (Number.isFinite(n)) onChange(n.toFixed(2));
          }
          : undefined
      }
    />
    {monetary ? <CurrencyAmountHint value={value} /> : null}
    </>
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
  const { text: tx } = useLanguage();
  return (
    <Field id={id} label={tx(label)} hint={tx(hint)} error={error}>
      <NumberInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={tx(placeholder)}
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
  const { text: tx } = useLanguage();
  return (
    <nav aria-label={tx("Steps")} className="flex items-center">
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
                {tx(s.title)}
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
  autoOpenTradeRisk,
  onToggleAutoOpenTradeRisk,
}: TradeFormProps) {
  const { text: tx } = useLanguage();
  const updateForm = (patch: Partial<FormState>) => {
    const xltResetFields = new Set([
      "curveLow",
      "curveHigh",
      "trend",
      "direction",
      "demandHigh",
      "demandLow",
      "supplyHigh",
      "supplyLow",
    ]);
    const shouldResetXlt = Object.keys(patch).some((key) =>
      xltResetFields.has(key) && key !== "xltAcknowledgement",
    );

    onChange(shouldResetXlt ? { ...patch, xltAcknowledgement: "" } : patch);
  };

  const remaining = STEP_FIELDS[step].filter(
    (key) => form[key].trim() === "",
  ).length;
  const isLast = step === STEPS.length - 1;
  const long = form.direction === "long";

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
  const xlt = (() => {
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
    const zoneType = form.direction === "long" ? ("demand" as const) : ("supply" as const);
    const curve = locateOnCurve(entryProximal, curveLow, curveHigh);
    const scenario = xltScenario(zoneType, curve, form.trend);
    return scenario
      ? { cellKey: `${zoneType}:${curve}:${form.trend}`, scenario }
      : null;
  })();
  const xltChecked = xlt
    ? parseXltChecked(form.xltAcknowledgement, xlt.cellKey, xlt.scenario.items.length)
    : new Set<number>();
  const missingXltAcknowledgement =
    isLast &&
    xlt !== null &&
    xltChecked.size !== xlt.scenario.items.length;
  const blockedByZones =
    (step === 1 && curveStepError) ||
    (step === 3 && zoneStepError) ||
    (isLast && hasZoneErrors);
  // The trade strategy treats an entry zone scoring below 7 out of 10 (70%) as
  // no action, so the last step won't continue until a better zone is scored.
  const entryZoneTotal = isLast && !hasZoneErrors
    ? zoneTotal(computeZoneScores(form, form.direction), {
        strength: form.strength,
        time: form.time,
        freshness: form.freshness,
      })
    : null;
  const entryScoreTooLow = entryZoneTotal !== null && entryZoneTotal < 7;
  const xltScoreProblems = (() => {
    if (!isLast || !xlt || hasZoneErrors) return [];
    const problems: string[] = [];
    if (form.strength !== "" && Number(form.strength) < 2) {
      problems.push("Strength must score 2/2 on the scorecard.");
    }
    if (form.time !== "" && Number(form.time) < 0.5) {
      problems.push("Time must score at least 0.5 on the scorecard.");
    }
    if (form.freshness !== "" && Number(form.freshness) < 2) {
      problems.push("Freshness must score 2/2 on the scorecard.");
    }
    const computedScores = computeZoneScores(form, form.direction);
    if (
      computedScores &&
      !meetsProfitRatio(computedScores.ratio, xlt.scenario.requiredProfitZoneRatio)
    ) {
      problems.push(
        `Profit zone is ${computedScores.ratio.toFixed(2)}:1; this XLT scenario requires at least ${xlt.scenario.requiredProfitZoneRatio}:1.`,
      );
    }
    return problems;
  })();
  const xltScoreBlocked = xltScoreProblems.length > 0;
  const disableNext =
    remaining > 0 ||
    blockedByZones ||
    missingXltAcknowledgement ||
    entryScoreTooLow ||
    xltScoreBlocked;
  // Name the step(s) that actually hold the error, so the last-step notice
  // points where the highlighted field really is.
  const errorSteps = [
    curveStepError ? "Curve" : null,
    zoneStepError ? "Zones" : null,
  ]
    .filter(Boolean)
    .map((name) => tx(name))
    .join(tx(" and "));

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
    <div className={`mx-auto flex w-full flex-col px-5 py-10 lg:py-14 ${step === 4 ? "max-w-5xl" : "max-w-xl"}`}>
      <p className="text-xs font-medium text-muted-foreground lg:hidden">{tx("Step {0} of {1}", [tx(step + 1), tx(STEPS.length)])}</p>

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
            {tx(STEPS[step].title)}
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
          {tx(STEPS[step].blurb)}
        </p>
      </div>

      <div className="mt-8 flex-1 space-y-5">
        {step === 0 ? (
          <>
            <Field
              id="ticker"
              label={tx("Ticker symbol")}
              hint={tx("The asset symbol to identify this trade in your log")}
            >
              <Input
                id="ticker"
                type="text"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder={tx("NVDA")}
                value={form.ticker}
                onChange={(event) =>
                  onChange({
                    ticker: event.target.value.toUpperCase().replace(/[^A-Z0-9.-]/g, ""),
                  })
                }
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="balance"
                label={tx("Account balance ($)")}
                hint={tx("Your balance with your broker, used for all risk limits")}
              >
                <NumberInput
                  id="balance"
                  placeholder={tx("600")}
                  value={form.accountBalance}
                  onChange={(accountBalance) => onChange({ accountBalance })}
                  allowNegative
                />
              </Field>
              <Field
                id="atr"
                label={tx("Daily ATR ($)")}
                hint={
                  <>{tx("From")}{tx(" ")}
                    <a
                      href="https://finviz.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >{tx("finviz.com")}</a>{tx(" ")}{tx("(14-day Average True Range)")}</>
                }
              >
                <NumberInput
                  id="atr"
                  placeholder={tx("5.93")}
                  value={form.atr}
                  onChange={(atr) => onChange({ atr })}
                />
              </Field>
            </div>
            <Field
              id="timeframe"
              label={tx("Income objective")}
              hint={tx("Sets the stop buffer: 2% or 10% of Daily ATR")}
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
            >{tx(showAdvanced ? "Hide advanced settings" : "Show advanced settings")}</button>

            {showAdvanced ? (
              <>
                <Field
                  id="targetMode"
                  label={tx("Target mode")}
                  hint={tx("Percentage buffer, a mechanical 3:1, or Auto (the better of a {0}% buffer and 3:1)", [tx(TARGET_BUFFER_MAX_PCT)])}
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
                    label={tx("Target buffer (%)")}
                    hint={tx("Between {0}% and {1}%", [tx(TARGET_BUFFER_MIN_PCT), tx(TARGET_BUFFER_MAX_PCT)])}
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
                    label={tx("Risk per trade (%)")}
                    hint={tx("Up to 2%, to preserve the account")}
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
                    label={tx("Risk in open trades ($)")}
                    hint={
                      tx(autoOpenTradeRisk
                        ? "Auto-filled from open trades in the Trade log"
                        : "For the 6% rule. Leave 0 if this is your only trade")
                    }
                  >
                    <NumberInput
                      id="openRisk"
                      value={form.openTradeRisk}
                      onChange={(openTradeRisk) => onChange({ openTradeRisk })}
                      disabled={autoOpenTradeRisk}
                      formatOnBlur
                    />
                  </Field>
                </div>
                <Label className="items-center text-sm font-normal">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={autoOpenTradeRisk}
                    onChange={onToggleAutoOpenTradeRisk}
                  />{tx("Auto-fill open trade risk from the Trade log")}</Label>
              </>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="curveHigh"
                label={tx("Curve high ($)")}
                hint={tx("HTF supply zone distal line")}
                value={form.curveHigh}
                onChange={(curveHigh) => updateForm({ curveHigh })}
              />
              <PriceField
                id="curveLow"
                label={tx("Curve low ($)")}
                hint={tx("HTF demand zone distal line")}
                value={form.curveLow}
                onChange={(curveLow) => updateForm({ curveLow })}
                error={zoneErrors.curveLow}
              />
            </div>
            <div className="flex justify-center">
              <ChartTutorialButton
                curveHigh={form.curveHigh}
                curveLow={form.curveLow}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <Field id="trend" label={tx("Trend")} group>
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
              onChange={(trend) => updateForm({ trend })}
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
                label={tx("Supply distal ($)")}
                hint={tx("Top edge of the supply zone")}
                value={form.supplyHigh}
                onChange={(supplyHigh) => updateForm({ supplyHigh })}
                error={zoneErrors.supplyHigh}
              />
              <PriceField
                id="supplyLow"
                label={tx("Supply proximal ($)")}
                hint={tx("Bottom edge of the supply zone")}
                value={form.supplyLow}
                onChange={(supplyLow) => updateForm({ supplyLow })}
                error={zoneErrors.supplyLow}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                id="demandHigh"
                label={tx("Demand proximal ($)")}
                hint={tx("Top edge of the demand zone")}
                value={form.demandHigh}
                onChange={(demandHigh) => updateForm({ demandHigh })}
                error={zoneErrors.demandHigh}
              />
              <PriceField
                id="demandLow"
                label={tx("Demand distal ($)")}
                hint={tx("Bottom edge of the demand zone")}
                value={form.demandLow}
                onChange={(demandLow) => updateForm({ demandLow })}
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
            <Field id="direction" label={tx("Direction")} group>
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
                onChange={(direction) => updateForm({ direction })}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {tx(long
                ? "You enter at the demand zone and target the supply zone."
                : "You enter at the supply zone and target the demand zone.")}
            </p>
          </>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {tx(long ? "Buy long: enter at demand, target supply." : "Sell short: enter at supply, target demand.")}
              </p>
              <Button
                variant="outline"
                onClick={() => updateForm({
                  direction: long ? "short" : "long",
                  strength: form.opposingStrength,
                  time: form.opposingTime,
                  freshness: form.opposingFreshness,
                  opposingStrength: form.strength,
                  opposingTime: form.time,
                  opposingFreshness: form.freshness,
                })}
              >
                <ArrowLeftRight aria-hidden />
                {tx(long ? "Switch to sell short" : "Switch to buy long")}
              </Button>
            </div>
            <div className="grid items-start gap-6 min-[480px]:grid-cols-2 min-[480px]:gap-4 lg:gap-8">
              <ZoneScorecard
                key={`entry-${form.direction}`}
                form={form}
                direction={form.direction}
                ratings={{ strength: form.strength, time: form.time, freshness: form.freshness }}
                onChange={onChange}
              />
              <ZoneScorecard
                key={`target-${form.direction}`}
                form={form}
                direction={form.direction === "long" ? "short" : "long"}
                ratings={{ strength: form.opposingStrength, time: form.opposingTime, freshness: form.opposingFreshness }}
                opposing
                onChange={(patch) => onChange({
                  ...(patch.strength !== undefined ? { opposingStrength: patch.strength } : {}),
                  ...(patch.time !== undefined ? { opposingTime: patch.time } : {}),
                  ...(patch.freshness !== undefined ? { opposingFreshness: patch.freshness } : {}),
                })}
              />
            </div>
          </div>
        ) : null}
        {isLast && xlt ? (
          <div className="flex justify-center">
            <XltChecklistDialog
              scenario={xlt.scenario}
              checked={xltChecked}
              onToggle={(index, value) => {
                const next = new Set(xltChecked);
                if (value) next.add(index);
                else next.delete(index);
                onChange({
                  xltAcknowledgement: serializeXltChecked(xlt.cellKey, next),
                });
              }}
            />
          </div>
        ) : null}
      </div>

      {xltScoreProblems.length > 0 ? (
        <Alert className="mx-auto mt-6 max-w-xl">
          <AlertTitle>{tx("XLT score requirements not met")}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {xltScoreProblems.map((problem) => (
                <li key={problem}>{tx(problem)}</li>
              ))}
            </ul>{tx("Update the scorecard or choose another setup before continuing.")}</AlertDescription>
        </Alert>
      ) : null}

      {entryScoreTooLow ? (
        <Alert className="mx-auto mt-6 max-w-xl">
          <AlertTitle>{tx("Unqualified Entry Zone")}</AlertTitle>
          <AlertDescription>{tx("The trade strategy calls for no action on a score below 7 (70%). Choose and score a different entry zone to continue.")}</AlertDescription>
        </Alert>
      ) : null}

      {/* On the last step the erroring zone fields aren't visible, so point
          the user back to fix them. */}
      {isLast && hasZoneErrors ? (
        <p className="mt-6 text-center text-xs text-destructive">{tx("Some values are inconsistent. Go back to {0} to fix the highlighted fields.", [tx(errorSteps)])}</p>
      ) : null}

      {/* On mobile the footer sits behind the fixed action bar, so repeat it
          inline here for small screens. */}
      <p className="mt-10 text-center text-xs text-muted-foreground lg:hidden">
        <Disclaimer />
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
          <ChevronLeft aria-hidden />{tx("Back")}</Button>
        <Button
          onClick={onNext}
          disabled={disableNext}
          size="lg"
          className="flex-1 lg:flex-none"
        >
          {remaining > 0
            ? tx(remaining === 1 ? "{0} field left" : "{0} fields left", [remaining])
            : tx(blockedByZones
              ? "Check the highlighted values"
              : xltScoreBlocked
                ? "XLT score requirements not met"
                : entryScoreTooLow
                  ? "Score below 7"
                : missingXltAcknowledgement
                  ? "Confirm XLT criteria"
                  : isLast
                    ? "See my trade"
                    : "Next")}
          {!disableNext ? <ArrowRight aria-hidden /> : null}
        </Button>
      </div>
    </div>
  );
}
