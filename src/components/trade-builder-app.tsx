"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, Check, ChevronDown, ChevronUp, Copy, NotebookPen, RotateCcw, Trash2 } from "lucide-react";
import {
  buildTrade,
  deriveZoneLines,
  JUDGED_MAX,
  roundToCent,
  TARGET_BUFFER_MAX_PCT,
  TARGET_BUFFER_MIN_PCT,
  type Direction,
  type IncomeTimeframe,
  type TargetMode,
  type TradeInputs,
  type TradeResult,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionMatrix } from "@/components/decision-matrix";

export interface FormState {
  ticker: string;
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
  /** The XLT matrix cell the trader has explicitly acknowledged. */
  xltAcknowledgement: string;
}

const initialState: FormState = {
  ticker: "",
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
  xltAcknowledgement: "",
};

// v3: strength/time/freshness now default to "" (unanswered) instead of "0"
// (a deliberate score), a semantic change. A v2 save's "0" would otherwise
// load as a deliberate zero the user never chose, so bump the key and let
// old saves fall back to the new defaults instead.
const STORAGE_KEY = "tradebuilder-form-v3";
const TRADE_LOG_STORAGE_KEY = "tradebuilder-log-v1";
const REPORT_ISSUE_URL = "https://github.com/E-T-II/trade-builder-feedback.git";
const REPORT_EMAIL_URL = "mailto:tradebuilderfeedback@protonmail.com?subject=Trade%20Builder%20Report";

export interface TradeLogEntry {
  id: string;
  createdAt: string;
  ticker: string;
  direction: Direction;
  entry: number;
  stop: number;
  target: number;
  positionSize: number;
  capitalRequirement: number;
  totalTradeRisk: number;
  rewardRisk: number;
  score: number;
  /** Whether this order is still open in the market. */
  isOpen: boolean;
}

export function loadTradeLog(): TradeLogEntry[] {
  try {
    const raw = window.localStorage.getItem(TRADE_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): TradeLogEntry[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const candidate = entry as Record<string, unknown>;
      const valid =
        typeof candidate.id === "string" &&
        typeof candidate.createdAt === "string" &&
        (candidate.direction === "long" || candidate.direction === "short") &&
        ["entry", "stop", "target", "positionSize", "capitalRequirement", "totalTradeRisk", "rewardRisk", "score"].every(
          (key) => typeof candidate[key] === "number" && Number.isFinite(candidate[key]),
        );
      if (!valid) return [];
      return [{
        ...candidate,
        ticker: typeof candidate.ticker === "string" ? candidate.ticker : "Unknown",
        // Older saves predate this field; assume still open until marked otherwise.
        isOpen: typeof candidate.isOpen === "boolean" ? candidate.isOpen : true,
      } as TradeLogEntry];
    });
  } catch {
    return [];
  }
}

function saveTradeLog(entries: TradeLogEntry[]) {
  try {
    window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, JSON.stringify(entries));
  } catch { }
}

const REQUIRED: (keyof FormState)[] = [
  "ticker",
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

const exportUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const exportRatio = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function resultsTsv(result: TradeResult, ticker: string): string {
  const score = result.scorecard;
  const matrixDirection =
    result.objective === "long"
      ? "Long"
      : result.objective === "short"
        ? "Short"
        : "No action";
  const order = result.order;
  const headers = [
    "Ticker",
    "Strength",
    "Time",
    "Freshness",
    "Trend",
    "Curve",
    "Profit zone",
    "Total O.E. Score",
    "Decision matrix",
    "Stop loss",
    "Entry price",
    "Target price",
    "Position size",
    "Order type",
    "Capital required",
    "Risk per share",
    "Total trade risk",
    "Reward : risk",
  ];
  const values = [
    ticker.trim() || "Unknown",
    score.strength,
    score.time,
    score.freshness,
    score.trend,
    score.curve,
    score.profitZone,
    `${score.total} / 10`,
    matrixDirection,
    order ? exportUsd.format(order.stop) : "",
    order ? exportUsd.format(order.entry) : "",
    order ? exportUsd.format(order.target) : "",
    order?.positionSize ?? "",
    order
      ? result.entryType === "proximal"
        ? "Limit order"
        : "Stop limit order"
      : "",
    order ? exportUsd.format(order.capitalRequirement) : "",
    order ? exportUsd.format(order.riskPerShare) : "",
    order ? exportUsd.format(order.totalTradeRisk) : "",
    order ? `${exportRatio.format(order.rewardRisk)}:1` : "",
  ];
  return `${headers.join("\t")}\n${values.join("\t")}`;
}

export function tradeLogTsv(entries: TradeLogEntry[]): string {
  const headers = [
    "Date",
    "Ticker",
    "Direction",
    "Entry",
    "Stop",
    "Target",
    "Position size",
    "Capital required",
    "Total trade risk",
    "Reward : risk",
    "Score",
    "Status",
  ];
  const rows = entries.map((entry) =>
    [
      new Date(entry.createdAt).toLocaleString(),
      entry.ticker,
      entry.direction === "long" ? "Buy" : "Sell short",
      exportUsd.format(entry.entry),
      exportUsd.format(entry.stop),
      exportUsd.format(entry.target),
      entry.positionSize,
      exportUsd.format(entry.capitalRequirement),
      exportUsd.format(entry.totalTradeRisk),
      `${exportRatio.format(entry.rewardRisk)}:1`,
      `${entry.score} / 10`,
      entry.isOpen ? "Open" : "Closed",
    ].join("\t"),
  );
  return [headers.join("\t"), ...rows].join("\n");
}

export function TradeBuilderApp() {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyLogState, setCopyLogState] = useState<"idle" | "copied" | "error">("idle");
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [autoOpenTradeRisk, setAutoOpenTradeRisk] = useState(false);

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

  useEffect(() => {
    // The log is independent of the in-progress form, so Reset never reads,
    // writes, or clears it.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setTradeLog(loadTradeLog());
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
    } catch { }
  }, [form]);

  const update = (patch: Partial<FormState>) => {
    setForm((f) => {
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

      return shouldResetXlt
        ? { ...f, ...patch, xltAcknowledgement: "" }
        : { ...f, ...patch };
    });
  };

  const openTradeRiskFromLog = useMemo(
    () =>
      roundToCent(
        tradeLog
          .filter((entry) => entry.isOpen)
          .reduce((sum, entry) => sum + entry.totalTradeRisk, 0),
      ),
    [tradeLog],
  );

  // Keeps the field in sync with the log while the toggle is on, rather than
  // stamping a value once, so closing or deleting an open trade updates it too.
  useEffect(() => {
    if (!autoOpenTradeRisk) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from the trade log, an external store
    setForm((f) => ({ ...f, openTradeRisk: openTradeRiskFromLog.toFixed(2) }));
  }, [autoOpenTradeRisk, openTradeRiskFromLog]);

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => (inputs ? buildTrade(inputs) : null), [inputs]);

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyResults = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(resultsTsv(result, form.ticker));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  };

  const copyTradeLog = async () => {
    if (tradeLog.length === 0) return;
    try {
      await navigator.clipboard.writeText(tradeLogTsv(tradeLog));
      setCopyLogState("copied");
      window.setTimeout(() => setCopyLogState("idle"), 1800);
    } catch {
      setCopyLogState("error");
    }
  };

  const logTrade = () => {
    if (!result?.order) return;
    const entry: TradeLogEntry = {
      id: window.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ticker: form.ticker,
      direction: form.direction,
      entry: result.order.entry,
      stop: result.order.stop,
      target: result.order.target,
      positionSize: result.order.positionSize,
      capitalRequirement: result.order.capitalRequirement,
      totalTradeRisk: result.order.totalTradeRisk,
      rewardRisk: result.order.rewardRisk,
      score: result.scorecard.total,
      isOpen: true,
    };
    setTradeLog((entries) => {
      const updated = [entry, ...entries];
      saveTradeLog(updated);
      return updated;
    });
  };

  const deleteLogEntry = (id: string) => {
    setTradeLog((entries) => {
      const updated = entries.filter((entry) => entry.id !== id);
      saveTradeLog(updated);
      return updated;
    });
  };

  const setLogEntryOpen = (id: string, isOpen: boolean) => {
    setTradeLog((entries) => {
      const updated = entries.map((entry) =>
        entry.id === id ? { ...entry, isOpen } : entry,
      );
      saveTradeLog(updated);
      return updated;
    });
  };

  const clearTradeLog = () => {
    setTradeLog([]);
    saveTradeLog([]);
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
                autoOpenTradeRisk={autoOpenTradeRisk}
                onToggleAutoOpenTradeRisk={() => setAutoOpenTradeRisk((s) => !s)}
              />
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10">
              {result ? (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {result.order ? (
                      <Button className="w-full sm:w-auto" onClick={logTrade}>
                        <NotebookPen aria-hidden />
                        Log trade
                      </Button>
                    ) : null}
                    <Button className="w-full sm:w-auto" variant="outline" onClick={copyResults}>
                      {copyState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
                      {copyState === "copied"
                        ? "Copied"
                        : copyState === "error"
                          ? "Copy failed"
                          : "Copy results"}
                    </Button>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="space-y-6">
                      <Reveal>
                        <Scorecard result={result} />
                      </Reveal>
                      <Reveal delay={360}>
                        <DecisionMatrix
                          zoneType={form.direction === "long" ? "demand" : "supply"}
                          curve={result.scorecard.curveZone}
                          trend={form.trend}
                        />
                      </Reveal>
                    </div>
                    <div className="flex flex-col gap-6">
                      <Reveal delay={140}>
                        <OrderTicket result={result} direction={form.direction} />
                      </Reveal>
                      <Reveal delay={240}>
                        <RiskChecks result={result} />
                      </Reveal>
                    </div>
                  </div>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-1">
                        <CardTitle>Trade log</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-expanded={showTradeLog}
                          aria-label={showTradeLog ? "Hide trade log" : "Show trade log"}
                          onClick={() => setShowTradeLog((s) => !s)}
                        >
                          {showTradeLog ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
                        </Button>
                      </div>
                      {tradeLog.length > 0 && showTradeLog ? (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={copyTradeLog}>
                            {copyLogState === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
                            {copyLogState === "copied"
                              ? "Copied"
                              : copyLogState === "error"
                                ? "Copy failed"
                                : "Copy log"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={clearTradeLog}>
                            <Trash2 aria-hidden />
                            Clear log
                          </Button>
                        </div>
                      ) : null}
                    </CardHeader>
                    {showTradeLog ? (
                      <CardContent>
                        {tradeLog.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No trades logged yet.</p>
                        ) : (
                          <div className="divide-y">
                            {tradeLog.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                <div className="min-w-0">
                                  <p className="font-medium">
                                    {entry.ticker} | {entry.direction === "long" ? "Buy" : "Sell short"} {entry.positionSize} shares
                                  </p>
                                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                                    Entry {exportUsd.format(entry.entry)} | Stop {exportUsd.format(entry.stop)} | Target {exportUsd.format(entry.target)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(entry.createdAt).toLocaleString()} | Score {entry.score} / 10 | {exportRatio.format(entry.rewardRisk)}:1
                                  </p>
                                </div>
                                <div
                                  role="radiogroup"
                                  aria-label={`${entry.ticker} trade status`}
                                  className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground"
                                >
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name={`trade-status-${entry.id}`}
                                      checked={entry.isOpen}
                                      onChange={() => setLogEntryOpen(entry.id, true)}
                                    />
                                    Open
                                  </label>
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="radio"
                                      name={`trade-status-${entry.id}`}
                                      checked={!entry.isOpen}
                                      onChange={() => setLogEntryOpen(entry.id, false)}
                                    />
                                    Closed
                                  </label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Delete logged trade"
                                  onClick={() => deleteLogEntry(entry.id)}
                                >
                                  <Trash2 aria-hidden />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    ) : null}
                    <CardContent className={showTradeLog ? "pt-0" : undefined}>
                      <p className="text-center text-xs text-muted-foreground">
                        Not shared between browsers or devices. Can be lost when
                        browser site data is cleared.
                      </p>
                    </CardContent>
                  </Card>
                </>
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

      <footer className="border-t border-border/60 bg-background/80 px-5 py-3 text-center text-[11px] text-muted-foreground lg:px-8">
        <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
          <a
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Report a problem
          </a>
          <span aria-hidden="true">•</span>
          <a
            href={REPORT_EMAIL_URL}
            className="underline-offset-2 hover:underline"
          >
            Email backup
          </a>
        </div>
      </footer>
    </div>
  );
}
