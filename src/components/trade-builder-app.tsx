"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, RotateCcw } from "lucide-react";
import {
  buildTrade,
  deriveZoneLines,
  JUDGED_MAX,
  type Direction,
  type IncomeTimeframe,
  type TradeInputs,
  type Trend,
} from "@/lib/trade-builder";
import {
  firstIncompleteStep,
  STEPS,
  TopStepper,
  TradeForm,
} from "@/components/trade-form";
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
  direction: Direction;
  trend: Trend;
  timeframe: IncomeTimeframe;
  atr: string;
  curveLow: string;
  curveHigh: string;
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
  targetBuffer: "75",
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
  strength: "0",
  time: "0",
  freshness: "0",
  openTradeRisk: "0",
};

// v2: the demand/supply zone fields replace the v1 entry/target form, a
// different shape, so old saves shouldn't be restored under this key.
const STORAGE_KEY = "tradebuilder-form-v2";

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
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.min(max, Math.max(0, Math.round(n / step) * step)));
}

// Read the saved form, ignoring anything that isn't the shape we persist (every
// field is a string). Malformed but valid JSON, e.g. a number where a string is
// expected, would otherwise crash later on `.trim()`, so return null and let the
// app fall back to initialState.
export function loadStoredForm(): Partial<FormState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (Object.values(parsed).some((v) => typeof v !== "string")) return null;
    return parsed as Partial<FormState>;
  } catch {
    return null;
  }
}

// Empty or non-positive percents fall back to the default. Advanced settings
// intentionally let the user exceed the recommended 2% risk / 80% buffer, so the
// ceiling here is only a sanity cap (100%), not the strategy's rule.
function clampPercent(raw: string, fallback: number, max: number): number {
  const n = raw.trim() === "" ? fallback : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function toInputs(form: FormState): TradeInputs | null {
  if (missingFields(form) > 0) return null;

  const numbers = {
    accountBalance: Number(form.accountBalance),
    riskTolerancePct: clampPercent(form.riskTolerance, 2, 100) / 100,
    targetBufferPct: clampPercent(form.targetBuffer, 75, 100) / 100,
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

  // The engine works in entry/target lines; direction assigns them from the zones.
  const lines = deriveZoneLines(zones, form.direction);

  return {
    ...numbers,
    ...lines,
    direction: form.direction,
    trend: form.trend,
    timeframe: form.timeframe,
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
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
      {/* Brand left, step rail center (desktop only), actions right. */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 py-4 lg:gap-10 lg:px-8">
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
                    Some inputs don&apos;t look like numbers. Go back and check
                    them.
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
