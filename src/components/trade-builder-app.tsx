"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartCandlestick } from "lucide-react";
import {
  buildTrade,
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
import { ScoreBar, ScoreChip } from "@/components/score-bar";
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
  entryProximal: string;
  entryDistal: string;
  targetProximal: string;
  targetDistal: string;
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
  entryProximal: "",
  entryDistal: "",
  targetProximal: "",
  targetDistal: "",
  strength: "0",
  time: "0",
  freshness: "0",
  openTradeRisk: "0",
};

const exampleState: FormState = {
  accountBalance: "2500",
  riskTolerance: "2",
  targetBuffer: "75",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: "4",
  curveLow: "100",
  curveHigh: "130",
  entryProximal: "108",
  entryDistal: "106",
  targetProximal: "124",
  targetDistal: "126",
  strength: "1",
  time: "0.5",
  freshness: "1",
  openTradeRisk: "0",
};

const STORAGE_KEY = "tradebuilder-form-v1";

const REQUIRED: (keyof FormState)[] = [
  "accountBalance",
  "atr",
  "curveLow",
  "curveHigh",
  "entryProximal",
  "entryDistal",
  "targetProximal",
  "targetDistal",
];

function missingFields(form: FormState): number {
  return REQUIRED.filter((key) => form[key].trim() === "").length;
}

function toInputs(form: FormState): TradeInputs | null {
  if (missingFields(form) > 0) return null;

  const numbers = {
    accountBalance: Number(form.accountBalance),
    riskTolerancePct: Number(form.riskTolerance) / 100,
    targetBufferPct: Number(form.targetBuffer) / 100,
    atr: Number(form.atr),
    curveLow: Number(form.curveLow),
    curveHigh: Number(form.curveHigh),
    entryProximal: Number(form.entryProximal),
    entryDistal: Number(form.entryDistal),
    targetProximal: Number(form.targetProximal),
    targetDistal: Number(form.targetDistal),
    strength: Number(form.strength),
    time: Number(form.time),
    freshness: Number(form.freshness),
    openTradeRisk: Number(form.openTradeRisk || "0"),
  };

  if (Object.values(numbers).some((n) => !Number.isFinite(n))) return null;
  if (numbers.accountBalance <= 0) return null;

  return {
    ...numbers,
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

  // Restore the last session after mount. This has to happen in an effect —
  // localStorage doesn't exist during server rendering, and reading it in the
  // initial state would make the server and client markup disagree.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (stored) setForm({ ...initialState, ...JSON.parse(stored) });
    } catch {
      // ignore a corrupt or blocked store
    }
  }, []);

  const update = (patch: Partial<FormState>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage may be unavailable (private mode) — the app still works
      }
      return next;
    });
  };

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => (inputs ? buildTrade(inputs) : null), [inputs]);

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reachable = firstIncompleteStep(form);
  const missing = missingFields(form);
  const inForm = step < RESULTS_STEP;
  const viewResults = () => {
    if (result) goToStep(RESULTS_STEP);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Typeform-style top bar: brand left, step rail centered, live score
          right. The rail and score are desktop-only; mobile keeps its own
          progress strip and sticky score bar. */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-5 py-4 lg:px-8">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ChartCandlestick className="size-5 text-primary" aria-hidden />
          Trade Builder
        </span>
        <div className="hidden lg:block">
          {inForm ? (
            <TopStepper step={step} reachable={reachable} onJump={goToStep} />
          ) : null}
        </div>
        <div className="hidden justify-end lg:flex">
          {inForm ? (
            <ScoreChip
              result={result}
              missingCount={missing}
              onView={viewResults}
            />
          ) : null}
        </div>
      </header>

      {inForm ? (
        <div className="flex flex-1 flex-col pb-36 lg:justify-center lg:pb-0">
          <TradeForm
            form={form}
            onChange={update}
            step={step}
            onBack={() => goToStep(Math.max(0, step - 1))}
            onNext={() => goToStep(step + 1)}
            onLoadExample={() => update(exampleState)}
            onReset={() => {
              update(initialState);
              goToStep(0);
            }}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced((s) => !s)}
          />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
          {result ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Scorecard result={result} />
              <div className="flex flex-col gap-6">
                <OrderTicket result={result} direction={form.direction} />
                <RiskChecks result={result} />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Some inputs don&apos;t look like numbers — go back and check
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

      {inForm ? (
        <ScoreBar
          result={result}
          missingCount={missing}
          onView={viewResults}
        />
      ) : null}
    </div>
  );
}
