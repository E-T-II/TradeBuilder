"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, RotateCcw } from "lucide-react";
import {
  buildTrade,
  deriveZoneLines,
  JUDGED_MAX,
  TARGET_BUFFER_MAX_PCT,
  TARGET_BUFFER_MIN_PCT,
  type Direction,
  type IncomeTimeframe,
  type TargetMode,
  type TradeInputs,
  type Trend,
} from "@/lib/trade-builder";
import {
  firstIncompleteStep,
  STEPS,
  TopStepper,
  TradeForm,
} from "@/components/trade-form";
import { clampNumericString } from "@/lib/utils";
import { Scorecard } from "@/components/scorecard";
import { OrderTicket } from "@/components/order-ticket";
import { RiskChecks } from "@/components/risk-checks";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface FormState {
  accountBalance: string;
  riskTolerance: string; // percent, e.g. "2"
  targetBuffer: string; // percent, e.g. "75"
  targetMode: TargetMode; // how the target is derived
  direction: Direction;
  trend: Trend;
  timeframe: IncomeTimeframe;
  atr: string;
  curveLow: string;
  curveHigh: string;
  // high/low are the storage names; the UI labels them distal/proximal, and the
  // mapping inverts between zones: supply high = distal, demand high = proximal
  // (near edge). Don't "fix" one side to match the labels without the other.
  demandHigh: string;
  demandLow: string;
  supplyHigh: string;
  supplyLow: string;
  strength: string;
  time: string;
  freshness: string;
  openTradeRisk: string;
}

const initialState: FormState = {
  accountBalance: "",
  riskTolerance: "2",
  targetBuffer: String(TARGET_BUFFER_MIN_PCT),
  targetMode: "percent",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: "",
  curveLow: "",
  curveHigh: "",
  demandHigh: "",
  demandLow: "",
  supplyHigh: "",
  supplyLow: "",
  // Empty, not "0": these are unanswered until the user picks a chip, and "0"
  // is itself a valid deliberate score, so the two states can't share a value.
  strength: "",
  time: "",
  freshness: "",
  openTradeRisk: "0",
};

// v3: strength/time/freshness now default to "" (unanswered) instead of "0"
// (a deliberate score), a semantic change. A v2 save's "0" would otherwise
// load as a deliberate zero the user never chose, so bump the key and let
// old saves fall back to the new defaults instead.
const STORAGE_KEY = "tradebuilder-form-v3";

const REQUIRED: (keyof FormState)[] = [
  "accountBalance",
  "atr",
  "curveLow",
  "curveHigh",
  "demandHigh",
  "demandLow",
  "supplyHigh",
  "supplyLow",
];

function missingFields(form: FormState): number {
  return REQUIRED.filter((key) => form[key].trim() === "").length;
}

// Snap a persisted judged value to a valid step; older saves may hold a
// half-point strength/freshness that's no longer an option.
export function snapStep(value: string, step: number, max: number): string {
  if (value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.min(max, Math.max(0, Math.round(n / step) * step)));
}

// Enum fields need their values checked, not just their type: `direction:
// "banana"` is a string, so a shape-only check would pass it through and the
// engine would silently treat it as the non-long branch.
const ENUM_VALUES: { [K in keyof FormState]?: readonly string[] } = {
  direction: ["long", "short"] satisfies Direction[],
  trend: ["uptrend", "sideways", "downtrend"] satisfies Trend[],
  timeframe: ["daily", "weekly"] satisfies IncomeTimeframe[],
  targetMode: ["percent", "ratio", "auto"] satisfies TargetMode[],
};

// Read the saved form, keeping only the fields that match the shape we persist:
// known keys with string values, and enum fields whose value is in range. A
// number where a string is expected would otherwise crash later on `.trim()`,
// and a bad enum would skew the results, so those fields are dropped and fall
// back to their initialState default rather than discarding the whole save.
// Returns null when nothing usable remains.
export function loadStoredForm(): Partial<FormState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!Object.hasOwn(initialState, key)) continue;
      if (typeof value !== "string") continue;
      const allowed = ENUM_VALUES[key as keyof FormState];
      if (allowed && !allowed.includes(value)) continue;
      clean[key] = value;
    }
    return Object.keys(clean).length > 0 ? (clean as Partial<FormState>) : null;
  } catch {
    return null;
  }
}

// Empty or non-positive percents fall back to the default. The strategy's
// rules are hard limits, not suggestions: risk can't exceed 2% (preserve the
// account) and the target buffer must stay in 75-80% (so the take-profit order
// fills before price turns at the opposing zone), so advanced settings clamp
// to those bounds rather than letting the user go past them.
function clampPercent(
  raw: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = raw.trim() === "" ? fallback : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, n));
}

// A balance of exactly 0 (or a typo like "-5") parses fine but can't size a
// trade; the generic "not a number" fallback copy is wrong for it.
export function hasNonPositiveBalance(form: FormState): boolean {
  const n = Number(form.accountBalance);
  return Number.isFinite(n) && n <= 0;
}

// An ATR of 0 parses fine but leaves no stop buffer (buffer = ATR x 2%/10%),
// so the stop would sit right on the distal. Treat it as invalid input.
export function hasNonPositiveAtr(form: FormState): boolean {
  const n = Number(form.atr);
  return Number.isFinite(n) && n <= 0;
}

// A blank risk field means "use the 2% default", but an explicit 0 (or a
// negative) means zero risk budget — no position can be sized. Flag only the
// explicit case so the field and the engine agree instead of the field showing
// 0 while clampPercent falls back to 2%.
export function hasNonPositiveRisk(form: FormState): boolean {
  if (form.riskTolerance.trim() === "") return false;
  const n = Number(form.riskTolerance);
  return Number.isFinite(n) && n <= 0;
}

export function toInputs(form: FormState): TradeInputs | null {
  if (missingFields(form) > 0) return null;

  const numbers = {
    accountBalance: Number(form.accountBalance),
    riskTolerancePct: clampPercent(form.riskTolerance, 2, 0, 2) / 100,
    targetBufferPct:
      clampPercent(
        form.targetBuffer,
        TARGET_BUFFER_MIN_PCT,
        TARGET_BUFFER_MIN_PCT,
        TARGET_BUFFER_MAX_PCT,
      ) / 100,
    atr: Number(form.atr),
    curveLow: Number(form.curveLow),
    curveHigh: Number(form.curveHigh),
    strength: Number(form.strength),
    time: Number(form.time),
    freshness: Number(form.freshness),
    openTradeRisk: Number(form.openTradeRisk || "0"),
  };

  const zones = {
    demandHigh: Number(form.demandHigh),
    demandLow: Number(form.demandLow),
    supplyHigh: Number(form.supplyHigh),
    supplyLow: Number(form.supplyLow),
  };

  if (Object.values(numbers).some((n) => !Number.isFinite(n))) return null;
  if (Object.values(zones).some((n) => !Number.isFinite(n))) return null;
  if (numbers.accountBalance <= 0) return null;
  if (numbers.atr <= 0) return null;
  if (hasNonPositiveRisk(form)) return null;

  // The engine works in entry/target lines; direction assigns them from the zones.
  const lines = deriveZoneLines(zones, form.direction);

  return {
    ...numbers,
    ...lines,
    direction: form.direction,
    trend: form.trend,
    timeframe: form.timeframe,
    targetMode: form.targetMode,
  };
}

const RESULTS_STEP = STEPS.length;

export function TradeBuilderApp() {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const firstPersist = useRef(true);

  // In an effect, not initial state: localStorage is client-only, so reading
  // it during render would desync server and client markup.
  useEffect(() => {
    const stored = loadStoredForm();
    if (!stored) return;
    const merged = { ...initialState, ...stored };
    merged.strength = snapStep(merged.strength, 1, JUDGED_MAX.strength);
    merged.freshness = snapStep(merged.freshness, 1, JUDGED_MAX.freshness);
    merged.time = snapStep(merged.time, 0.5, JUDGED_MAX.time);
    // Older saves may hold a risk/buffer outside the caps introduced with the
    // advanced-settings limits; normalize on load so the field can't render out
    // of sync with the clamped order math (the blur handler only runs if the
    // user opens advanced settings and edits the field).
    merged.riskTolerance = clampNumericString(merged.riskTolerance, 0, 2);
    merged.targetBuffer = clampNumericString(
      merged.targetBuffer,
      TARGET_BUFFER_MIN_PCT,
      TARGET_BUFFER_MAX_PCT,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setForm(merged);
  }, []);

  // Persist on change. Skip the first run so we don't overwrite the stored
  // value before the hydration effect above has applied it.
  useEffect(() => {
    if (firstPersist.current) {
      firstPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const update = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => (inputs ? buildTrade(inputs) : null), [inputs]);

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reachable = firstIncompleteStep(form);
  const inForm = step < RESULTS_STEP;

  return (
    <div className="flex flex-1 flex-col">
      {/* Mobile: brand left, actions right (the center stepper is hidden, so a
          two-end flex keeps the icons flush right). Desktop: 3-column grid with
          the stepper centered. */}
      <header className="flex items-center justify-between gap-6 px-5 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-10 lg:px-8">
        <span className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight">
          <Blocks className="size-5 shrink-0 text-primary" aria-hidden />
          Trade Builder
        </span>
        <div className="hidden lg:block">
          {inForm ? (
            <TopStepper step={step} reachable={reachable} onJump={goToStep} />
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 lg:gap-3">
          {inForm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                update(initialState);
                goToStep(0);
              }}
              aria-label="Reset"
            >
              <RotateCcw aria-hidden />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      {/* Inset rounded panel on large screens; mobile is full-bleed. */}
      <div className="flex flex-1 flex-col lg:px-4 lg:pb-4">
        <div className="flex flex-1 flex-col lg:rounded-3xl lg:bg-neutral-200/60 dark:lg:bg-neutral-800/30">
          {inForm ? (
            <div className="flex flex-1 flex-col pb-24 lg:justify-center lg:pb-0">
              <TradeForm
                form={form}
                onChange={update}
                step={step}
                onBack={() => goToStep(Math.max(0, step - 1))}
                onNext={() => goToStep(step + 1)}
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced((s) => !s)}
              />
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
              {result ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Reveal>
                    <Scorecard result={result} />
                  </Reveal>
                  <div className="flex flex-col gap-6">
                    <Reveal delay={140}>
                      <OrderTicket result={result} direction={form.direction} />
                    </Reveal>
                    <Reveal delay={240}>
                      <RiskChecks result={result} />
                    </Reveal>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {hasNonPositiveBalance(form)
                      ? "Your account balance needs to be greater than zero to size a trade."
                      : hasNonPositiveAtr(form)
                        ? "The daily ATR needs to be greater than zero to set the stop buffer."
                        : hasNonPositiveRisk(form)
                          ? "Your risk per trade needs to be greater than zero to size a trade."
                          : "Some inputs don't look like numbers. Go back and check them."}
                  </CardContent>
                </Card>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => goToStep(0)}>
                  Edit trade
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    update(initialState);
                    goToStep(0);
                  }}
                >
                  Start over
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
