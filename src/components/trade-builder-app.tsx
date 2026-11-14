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

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Blocks, ChevronDown, ChevronUp, NotebookPen, RotateCcw, Trash2, Upload, X } from "lucide-react";
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
import { TradePlanExport } from "@/components/trade-plan-export";
import { TradeLogExport } from "@/components/trade-log-export";
import { TradeExecutionFields } from "@/components/trade-execution-fields";
import { PnlCalendar } from "@/components/pnl-calendar";
import { EXECUTION_FIELDS, isTradeDate, type ExecutionDetails, type ExecutionField } from "@/lib/trade-execution";
import { RiskChecks } from "@/components/risk-checks";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DecisionMatrix } from "@/components/decision-matrix";
import { TradeBackupControls } from "@/components/trade-backup-controls";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { CurrencyProvider, useCurrency } from "@/components/currency-provider";
import { CurrencySelector } from "@/components/currency-selector";
import { CurrencyNote, CurrencyAmountHint } from "@/components/currency-note";
import { formatHistoricalTotal, isDisplayRate, type DisplayRate } from "@/lib/display-currency";
import { currencyText } from "@/lib/currency-translations";
import {
  FORM_ENUM_VALUES,
  FORM_STORAGE_KEY as STORAGE_KEY,
  restoreTradeBackup,
  TRADE_LOG_STORAGE_KEY,
  type TradeBackup,
} from "@/lib/trade-backup";

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
  opposingStrength: string;
  opposingTime: string;
  opposingFreshness: string;
  openTradeRisk: string;
  /**
   * The XLT checklist state: "" when untouched, or
   * "<zoneType>:<curve>:<trend>|v2:<checked item indexes>". A bare cell key
   * (the legacy single-checkbox format) counts as fully verified.
   * See src/lib/xlt-criteria.ts.
   */
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
  opposingStrength: "",
  opposingTime: "",
  opposingFreshness: "",
  openTradeRisk: "0",
  xltAcknowledgement: "",
};

// v3: strength/time/freshness now default to "" (unanswered) instead of "0"
// (a deliberate score), a semantic change. A v2 save's "0" would otherwise
// load as a deliberate zero the user never chose, so bump the key and let
// old saves fall back to the new defaults instead.
const REPORT_ISSUE_URL = "https://github.com/E-T-II/trade-builder-feedback/issues/new/choose";
const REPORT_EMAIL_URL = "mailto:tradebuilderfeedback@protonmail.com?subject=Trade%20Builder%20Report";

export interface TradeLogEntry extends ExecutionDetails {
  /** Display-only rate captured when logged; never used by trading calculations. */
  displayRate?: DisplayRate;
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
  /** Closing price entered when the trade is marked closed. */
  exitPrice?: string;
  /** Exact realized profit or loss entered for the completed trade. */
  profitLoss?: string;
  /** Total fees for the completed trade. Blank or absent means no fees recorded. */
  fees?: string;
  /** Trader's notes for this setup or its outcome. */
  notes?: string;
  /** The builder inputs that produced this entry, so it can be reloaded later. Absent on pre-v2 saves. */
  form?: Partial<FormState>;
}

class SavedExchangeRateError extends Error {}

function sanitizeOutcomeField(value: unknown, allowZero: boolean): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "") return value;
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    return undefined;
  }
  return value;
}

function sanitizeProfitLoss(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value === "") return value;
  return Number.isFinite(Number(value)) ? value : undefined;
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
      const exitPrice = sanitizeOutcomeField(candidate.exitPrice, false);
      const fees = sanitizeOutcomeField(candidate.fees, true);
      const profitLoss = sanitizeProfitLoss(candidate.profitLoss);
      const cleanCandidate = { ...candidate };
      if (cleanCandidate.displayRate !== undefined && !isDisplayRate(cleanCandidate.displayRate)) {
        throw new SavedExchangeRateError("Invalid saved exchange rate in trade log.");
      }
      delete cleanCandidate.exitPrice;
      delete cleanCandidate.fees;
      delete cleanCandidate.profitLoss;
      if (typeof cleanCandidate.notes !== "string") delete cleanCandidate.notes;
      for (const field of EXECUTION_FIELDS) {
        if (typeof cleanCandidate[field] !== "string") delete cleanCandidate[field];
      }
      return [{
        ...cleanCandidate,
        ticker: typeof candidate.ticker === "string" ? candidate.ticker : "Unknown",
        // Older saves predate this field; assume still open until marked otherwise.
        isOpen: typeof candidate.isOpen === "boolean" ? candidate.isOpen : true,
        ...(exitPrice !== undefined ? { exitPrice } : {}),
        ...(fees !== undefined ? { fees } : {}),
        ...(profitLoss !== undefined ? { profitLoss } : {}),
        form: sanitizeFormPatch(candidate.form) ?? undefined,
      } as TradeLogEntry];
    });
  } catch (error) {
    if (error instanceof SavedExchangeRateError) throw error;
    return [];
  }
}

function saveTradeLog(entries: TradeLogEntry[]) {
  window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, JSON.stringify(entries));
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
const ENUM_VALUES: { [K in keyof FormState]?: readonly string[] } = FORM_ENUM_VALUES;

// Keep only the fields that match the shape we persist: known keys with
// string values, and enum fields whose value is in range. A number where a
// string is expected would otherwise crash later on `.trim()`, and a bad enum
// would skew the results, so those fields are dropped and fall back to their
// initialState default rather than discarding the whole save. Returns null
// when nothing usable remains. Shared by the form autosave and the trade log's
// per-entry setup snapshot, which persist through the same untyped JSON path.
function sanitizeFormPatch(parsed: unknown): Partial<FormState> | null {
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
}

export function loadStoredForm(): Partial<FormState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return sanitizeFormPatch(parsed);
  } catch {
    return null;
  }
}

// Merge a partial save (autosave or a logged setup) onto the defaults and
// snap/clamp the judged and advanced fields, so a value from before those
// limits existed can't render out of sync with the clamped order math.
export function normalizeForm(stored: Partial<FormState>): FormState {
  const merged = { ...initialState, ...stored };
  merged.strength = snapStep(merged.strength, 1, JUDGED_MAX.strength);
  merged.freshness = snapStep(merged.freshness, 1, JUDGED_MAX.freshness);
  merged.time = snapStep(merged.time, 0.5, JUDGED_MAX.time);
  merged.opposingStrength = snapStep(merged.opposingStrength, 1, JUDGED_MAX.strength);
  merged.opposingTime = snapStep(merged.opposingTime, 0.5, JUDGED_MAX.time);
  merged.opposingFreshness = snapStep(merged.opposingFreshness, 1, JUDGED_MAX.freshness);
  merged.riskTolerance = clampNumericString(merged.riskTolerance, 0, 2);
  merged.targetBuffer = clampNumericString(
    merged.targetBuffer,
    TARGET_BUFFER_MIN_PCT,
    TARGET_BUFFER_MAX_PCT,
  );
  return merged;
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

const exportRatio = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function realizedOutcome(entry: TradeLogEntry): number | null {
  if (entry.isOpen) return null;
  if (entry.profitLoss !== undefined && entry.profitLoss.trim() !== "") {
    const profitLoss = Number(entry.profitLoss);
    return Number.isFinite(profitLoss) ? roundToCent(profitLoss) : null;
  }
  if (entry.exitPrice === undefined || entry.exitPrice.trim() === "") return null;
  const exitPrice = Number(entry.exitPrice);
  const fees = entry.fees === undefined || entry.fees.trim() === "" ? 0 : Number(entry.fees);
  if (
    !Number.isFinite(exitPrice) ||
    exitPrice <= 0 ||
    !Number.isFinite(fees) ||
    fees < 0 ||
    entry.positionSize <= 0
  ) {
    return null;
  }
  const priceChange =
    entry.direction === "long"
      ? exitPrice - entry.entry
      : entry.entry - exitPrice;
  const grossPnl = priceChange * entry.positionSize;
  if (!Number.isFinite(grossPnl)) return null;
  const netPnl = grossPnl - fees;
  if (!Number.isFinite(netPnl)) return null;
  return roundToCent(netPnl);
}

/**
 * Average winning trade divided by the size of the average losing trade, e.g.
 * wins averaging $300 against losses averaging $100 is 3 (3:1). Breakeven
 * outcomes count as neither. Null until there is at least one loss to divide
 * by; 0 when there are losses but no wins yet.
 */
export function averageProfitLossRatio(outcomes: number[]): number | null {
  const wins = outcomes.filter((outcome) => outcome > 0);
  const losses = outcomes.filter((outcome) => outcome < 0);
  if (losses.length === 0) return null;
  const toCents = (value: number) => Math.round(value * 100) / 100;
  const averageLoss = toCents(Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / losses.length));
  if (wins.length === 0) return 0;
  const averageWin = toCents(wins.reduce((sum, win) => sum + win, 0) / wins.length);
  return averageWin / averageLoss;
}

export function TradeBuilderApp() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <TradeBuilderContent />
      </CurrencyProvider>
    </LanguageProvider>
  );
}

function TradeBuilderContent() {
  const { text: tx, language } = useLanguage();
  const { currency, rate, format } = useCurrency();
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [logSaveError, setLogSaveError] = useState("");
  const [logRateError, setLogRateError] = useState(false);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [autoOpenTradeRisk, setAutoOpenTradeRisk] = useState(false);
  const [openTradeDetailsId, setOpenTradeDetailsId] = useState<string | null>(null);
  const [closingDraft, setClosingDraft] = useState<{
    id: string;
    pendingClose: boolean;
    profitLoss: string;
    closedOn: string;
  } | null>(null);
  const [closingNotice, setClosingNotice] = useState(false);

  const firstPersist = useRef(true);

  // In an effect, not initial state: localStorage is client-only, so reading
  // it during render would desync server and client markup.
  useEffect(() => {
    const stored = loadStoredForm();
    if (!stored) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setForm(normalizeForm(stored));
  }, []);

  useEffect(() => {
    // The log is independent of the in-progress form, so Reset never reads,
    // writes, or clears it.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setTradeLog(loadTradeLog());
    } catch {
      setLogRateError(true);
    }
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

  const persistTradeLog = (updated: TradeLogEntry[]) => {
    if (logRateError) return;
    try {
      saveTradeLog(updated);
      setTradeLog(updated);
      setLogSaveError("");
    } catch {
      setLogSaveError("Trade log changes could not be saved. Check browser storage permissions or available space, then try again. Your previous log was kept.");
    }
  };

  const updateLogOutcome = (
    id: string,
    field: "exitPrice" | "profitLoss" | "fees" | "notes" | ExecutionField,
    value: string,
  ) => {
    persistTradeLog(tradeLog.map((entry) =>
      entry.id === id ? { ...entry, [field]: value } : entry,
    ));
  };

  const validClosingDetails = (profitLoss: string, closedOn: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return profitLoss.trim() !== "" && Number.isFinite(Number(profitLoss)) &&
      isTradeDate(closedOn) && closedOn <= today;
  };

  const openTradeDetails = (entry: TradeLogEntry, pendingClose = false) => {
    setClosingNotice(false);
    setClosingDraft({
      id: entry.id,
      pendingClose,
      profitLoss: entry.profitLoss ?? "",
      closedOn: entry.closedOn ?? "",
    });
    setOpenTradeDetailsId(entry.id);
  };

  const updateClosingDraft = (entry: TradeLogEntry, field: "profitLoss" | "closedOn", value: string) => {
    if (!closingDraft || closingDraft.id !== entry.id) return;
    const updated = { ...closingDraft, [field]: value };
    setClosingDraft(updated);
    if (!entry.isOpen && validClosingDetails(updated.profitLoss, updated.closedOn)) {
      persistTradeLog(tradeLog.map((trade) =>
        trade.id === entry.id ? { ...trade, profitLoss: updated.profitLoss, closedOn: updated.closedOn } : trade,
      ));
    }
  };

  const closeTradeDetails = (entry: TradeLogEntry) => {
    if (closingDraft?.id === entry.id) {
      const { pendingClose, profitLoss, closedOn } = closingDraft;
      if (pendingClose && validClosingDetails(profitLoss, closedOn)) {
        persistTradeLog(tradeLog.map((trade) =>
          trade.id === entry.id ? { ...trade, isOpen: false, profitLoss, closedOn } : trade,
        ));
      } else if (
        (pendingClose || profitLoss !== (entry.profitLoss ?? "") || closedOn !== (entry.closedOn ?? "")) &&
        !validClosingDetails(profitLoss, closedOn)
      ) {
        setClosingNotice(true);
      }
    }
    setClosingDraft(null);
    setOpenTradeDetailsId(null);
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
      ...(rate ? { displayRate: { ...rate } } : {}),
      form: { ...form },
    };
    persistTradeLog([entry, ...tradeLog]);
  };

  // Reload a logged setup's original inputs back into the builder, so the
  // trader can review or re-run it. Pre-v2 entries predate the full snapshot,
  // so fall back to the ticker/direction they do carry rather than nothing.
  const loadLogEntry = (entry: TradeLogEntry) => {
    const patch: Partial<FormState> = entry.form ?? {
      ticker: entry.ticker,
      direction: entry.direction,
    };
    setForm(normalizeForm(patch));
    goToStep(0);
  };

  const deleteLogEntry = (id: string) => {
    persistTradeLog(tradeLog.filter((entry) => entry.id !== id));
  };

  const setLogEntryOpen = (id: string) => {
    setClosingNotice(false);
    persistTradeLog(tradeLog.map((entry) =>
      entry.id === id ? { ...entry, isOpen: true } : entry,
    ));
  };

  const clearTradeLog = () => {
    persistTradeLog([]);
  };

  const restoreBackup = (backup: TradeBackup) => {
    restoreTradeBackup(window.localStorage, backup);
    setAutoOpenTradeRisk(false);
    setForm(backup.form);
    setTradeLog(backup.tradeLog);
    setLogSaveError("");
    setLogRateError(false);
    setShowTradeLog(true);
    goToStep(0);
  };

  const reachable = firstIncompleteStep(form);
  const inForm = step < RESULTS_STEP;
  const completedOutcomes = tradeLog.flatMap((entry) => {
    const outcome = realizedOutcome(entry);
    return outcome !== null ? [outcome] : [];
  });
  const calendarOutcomes = tradeLog.flatMap((entry) => {
    const outcome = realizedOutcome(entry);
    return outcome !== null ? [{ closedOn: entry.closedOn, pnl: outcome, displayRate: entry.displayRate }] : [];
  });
  const historicalAmounts = calendarOutcomes.map((outcome) => ({ amount: outcome.pnl, displayRate: outcome.displayRate }));
  const profitLossRatio = averageProfitLossRatio(completedOutcomes);
  const winRate = completedOutcomes.length
    ? (completedOutcomes.filter((outcome) => outcome > 0).length /
        completedOutcomes.length) *
      100
    : 0;

  return (
    <div className="flex flex-1 flex-col pb-16 lg:pb-6">
      {/* Mobile: brand left, actions right (the center stepper is hidden, so a
          two-end flex keeps the icons flush right). Desktop: 3-column grid with
          the stepper centered. */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-10 lg:px-8">
        <span className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight">
          <Blocks className="size-5 shrink-0 text-primary" aria-hidden />{tx("Trade Builder")}</span>
        <div className="hidden lg:block">
          {inForm ? (
            <TopStepper step={step} reachable={reachable} onJump={goToStep} />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 lg:gap-3">
          <LanguageSelector />
          <CurrencySelector />
          <TradeBackupControls form={form} tradeLog={tradeLog} onRestore={restoreBackup} />
          {inForm ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                update(initialState);
                goToStep(0);
              }}
              aria-label={tx("Reset")}
            >
              <RotateCcw aria-hidden />
              <span className="hidden sm:inline">{tx("Reset")}</span>
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      {currency !== "USD" ? <div className="px-5 pb-2 lg:px-8"><CurrencyNote /></div> : null}
      {logRateError ? <p role="alert" className="px-5 text-sm text-destructive">{currencyText(language, "logError")}</p> : null}

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
                  <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                    {inputs ? (
                      <TradePlanExport form={form} inputs={inputs} result={result} />
                    ) : null}
                    {result.order ? (
                      <Button className="w-full sm:w-auto" onClick={logTrade}>
                        <NotebookPen aria-hidden />{tx("Log trade")}</Button>
                    ) : null}
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
                        <CardTitle>{tx("Trade log")}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-expanded={showTradeLog}
                          aria-label={tx(showTradeLog ? "Hide trade log" : "Show trade log")}
                          onClick={() => setShowTradeLog((s) => !s)}
                        >
                          {showTradeLog ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
                        </Button>
                      </div>
                      {tradeLog.length > 0 && showTradeLog ? (
                        <div className="flex items-center gap-1">
                          <TradeLogExport entries={tradeLog.map((entry) => ({
                            ...entry, realizedPnl: realizedOutcome(entry),
                          }))} />
                          <Button variant="ghost" size="sm" onClick={clearTradeLog}>
                            <Trash2 aria-hidden />{tx("Clear log")}</Button>
                        </div>
                      ) : null}
                    </CardHeader>
                    {showTradeLog ? (
                      <CardContent>
                        {logSaveError ? <p role="alert" className="mb-3 text-sm text-destructive">{tx(logSaveError)}</p> : null}
                        {closingNotice ? <p role="status" className="mb-3 text-sm text-destructive">{tx("A valid Closing date and Profit/Loss are required; incomplete changes are not saved.")}</p> : null}
                        <section aria-labelledby="trade-performance-heading" className="mb-5 space-y-3">
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <h3 id="trade-performance-heading" className="font-medium">{tx("Realized performance")}</h3>
                              <PnlCalendar outcomes={calendarOutcomes} />
                            </div>
                            <p className="text-xs text-muted-foreground">{tx("Uses entered Profit/Loss, or planned entry and share size less total round-trip fees.")}</p>
                            {currency !== "USD" ? <p className="text-xs text-muted-foreground">{currencyText(language, "mixed")}</p> : null}
                          </div>
                          {completedOutcomes.length > 0 ? (
                            <>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">{tx("Completed trades")}</p>
                                  <p className="font-mono tabular-nums">{tx(completedOutcomes.length)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">{tx("Ave P&L ratio")}</p>
                                  {profitLossRatio === null ? (
                                    <p className="text-sm text-muted-foreground">{tx("No losing trades yet")}</p>
                                  ) : (
                                    <p className="font-mono tabular-nums">{tx(profitLossRatio.toFixed(2))}:1</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">{tx("Win rate")}</p>
                                  <p className="font-mono tabular-nums">{tx(exportRatio.format(winRate))}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">{tx("Net P&L")}</p>
                                  <p className="font-mono tabular-nums">{formatHistoricalTotal(historicalAmounts, currency, language)}</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">{tx("A valid Closing date and Profit/Loss are required; incomplete changes are not saved.")}</p>
                          )}
                        </section>
                        {tradeLog.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{tx("No trades logged yet.")}</p>
                        ) : (
                          <div className="divide-y">
                            {tradeLog.map((entry) => {
                              const outcome = realizedOutcome(entry);
                              const exitValue = entry.exitPrice ?? "";
                              const draft = closingDraft?.id === entry.id ? closingDraft : null;
                              const profitLossValue = draft?.profitLoss ?? entry.profitLoss ?? "";
                              const detailOutcome = realizedOutcome({ ...entry, isOpen: false, profitLoss: profitLossValue });
                              const feesValue = entry.fees ?? "";
                              const invalidExitPrice =
                                exitValue !== "" &&
                                (!Number.isFinite(Number(exitValue)) || Number(exitValue) <= 0);
                              const invalidProfitLoss =
                                profitLossValue.trim() !== "" &&
                                !Number.isFinite(Number(profitLossValue));
                              const invalidFees =
                                feesValue !== "" &&
                                (!Number.isFinite(Number(feesValue)) || Number(feesValue) < 0);
                              const now = new Date();
                              const maxClosingDate = [
                                now.getFullYear(),
                                String(now.getMonth() + 1).padStart(2, "0"),
                                String(now.getDate()).padStart(2, "0"),
                              ].join("-");
                              return (
                                <div key={entry.id} className="py-3 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <Dialog.Root
                                        open={openTradeDetailsId === entry.id}
                                        onOpenChange={(open) => {
                                          if (open) openTradeDetails(entry);
                                          else closeTradeDetails(entry);
                                        }}
                                      >
                                        <Dialog.Trigger
                                          render={
                                            <button
                                              type="button"
                                              className="w-full cursor-pointer rounded-md text-left outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                                            />
                                          }
                                        >
                                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="font-medium">{tx("{0} | {1} {2} shares", [entry.ticker, tx(entry.direction === "long" ? "Buy" : "Sell short"), tx(entry.positionSize)])}</span>
                                            {outcome !== null ? (
                                              <span className={`font-mono text-xs font-semibold tabular-nums ${
                                                outcome > 0
                                                  ? "text-emerald-700 dark:text-emerald-400"
                                                  : outcome < 0
                                                    ? "text-red-700 dark:text-red-400"
                                                    : "text-muted-foreground"
                                              }`}>{tx("Profit/Loss {0}", [format(outcome, entry.displayRate ?? null, true)])}</span>
                                            ) : null}
                                          </span>
                                          <span className="block font-mono text-xs tabular-nums text-muted-foreground">{tx("Entry {0} | Stop {1} | Target {2}", [format(entry.entry, entry.displayRate ?? null), format(entry.stop, entry.displayRate ?? null), format(entry.target, entry.displayRate ?? null)])}</span>
                                          <span className="block text-xs text-muted-foreground">
                                            {new Date(entry.createdAt).toLocaleString()} {tx("| O.E. Score")} {tx(entry.score)} / 10 | <span className="whitespace-nowrap">{tx("Reward:Risk {0}:1", [tx(exportRatio.format(entry.rewardRisk))])}</span>
                                          </span>
                                        </Dialog.Trigger>
                                        <Dialog.Portal>
                                          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
                                          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(36rem,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none">
                                            <div className="mb-3 flex items-start justify-between gap-4">
                                              <div className="space-y-1">
                                                <Dialog.Title className="font-medium">{tx("{0} trade details", [entry.ticker])}</Dialog.Title>
                                                <Dialog.Description className="text-sm text-muted-foreground">
                                                  {tx(entry.direction === "long" ? "Buy" : "Sell short")} {tx(entry.positionSize)} {tx("shares · Entry")} {format(entry.entry, entry.displayRate ?? null)} {tx("· Stop")} {format(entry.stop, entry.displayRate ?? null)} {tx("· Target")} {format(entry.target, entry.displayRate ?? null)} · <span className="whitespace-nowrap">{tx("Reward:Risk {0}:1", [tx(exportRatio.format(entry.rewardRisk))])}</span>
                                                </Dialog.Description>
                                              </div>
                                              <Dialog.Close
                                                render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close {0} trade details", [entry.ticker])} />}
                                              >
                                                <X aria-hidden />
                                              </Dialog.Close>
                                            </div>
                                            <div className="space-y-4">
                                              <CurrencyNote savedRate={entry.displayRate ?? null} />
                                              {!entry.isOpen || draft?.pendingClose ? (
                                                <>
                                                  <p className="text-xs text-muted-foreground">{tx("A valid Closing date and Profit/Loss are required; incomplete changes are not saved.")}</p>
                                                  <div className="grid gap-3 sm:grid-cols-2">
                                                    <label className="space-y-1">
                                                      <span className="text-xs font-medium">{tx("Profit/Loss ($)")}</span>
                                                      <Input
                                                        aria-label={tx("Profit/Loss for {0}", [entry.ticker])}
                                                        aria-invalid={invalidProfitLoss || undefined}
                                                        required
                                                        type="number"
                                                        step="0.01"
                                                        inputMode="decimal"
                                                        value={profitLossValue}
                                                        onChange={(event) =>
                                                          updateClosingDraft(entry, "profitLoss", event.target.value)
                                                        }
                                                      />
                                                      <CurrencyAmountHint value={profitLossValue} savedRate={entry.displayRate ?? null} />
                                                      {invalidProfitLoss ? (
                                                        <span className="block text-xs text-destructive">{tx("Enter a valid amount, including a minus sign for a loss.")}</span>
                                                      ) : null}
                                                    </label>
                                                    <label className="space-y-1">
                                                      <span className="text-xs font-medium">{tx("Closing date")}</span>
                                                      <Input
                                                        aria-label={tx("Closing date for {0}", [entry.ticker])}
                                                        type="date"
                                                        required
                                                        max={maxClosingDate}
                                                        className="dark:scheme:light"
                                                        value={draft?.closedOn ?? entry.closedOn ?? ""}
                                                        onChange={(event) =>
                                                          updateClosingDraft(entry, "closedOn", event.target.value)
                                                        }
                                                      />
                                                    </label>
                                                  </div>
                                                  <div aria-live="polite" className="text-xs">
                                                    {detailOutcome !== null ? (
                                                      <span>{tx("Net P&L")}<strong>{format(detailOutcome, entry.displayRate ?? null, true)}</strong>
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                  <details
                                                    key={openTradeDetailsId}
                                                    className="rounded-md border p-3"
                                                  >
                                                    <summary className="cursor-pointer text-xs font-medium">{tx("Advanced details")}</summary>
                                                    <div className="mt-3 space-y-3">
                                                      <fieldset className="space-y-2 rounded-md border p-3">
                                                        <legend className="px-1 text-xs font-medium">{tx("Price and fees")}</legend>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                          <label className="space-y-1">
                                                            <span className="text-xs font-medium">{tx("Exit price ($)")}</span>
                                                            <Input
                                                              aria-label={`Exit price for ${entry.ticker}`}
                                                              aria-invalid={invalidExitPrice || undefined}
                                                              type="number"
                                                              min="0"
                                                              step="any"
                                                              inputMode="decimal"
                                                              value={exitValue}
                                                              onChange={(event) =>
                                                                updateLogOutcome(entry.id, "exitPrice", event.target.value)
                                                              }
                                                            />
                                                            <CurrencyAmountHint value={exitValue} savedRate={entry.displayRate ?? null} />
                                                            {invalidExitPrice ? (
                                                              <span className="block text-xs text-destructive">{tx("Enter a closing price above zero.")}</span>
                                                            ) : null}
                                                          </label>
                                                          <label className="space-y-1">
                                                            <span className="text-xs font-medium">{tx("Fees ($, optional)")}</span>
                                                            <Input
                                                              aria-label={`Fees for ${entry.ticker}`}
                                                              aria-invalid={invalidFees || undefined}
                                                              type="number"
                                                              min="0"
                                                              step="any"
                                                              inputMode="decimal"
                                                              value={feesValue}
                                                              onChange={(event) =>
                                                                updateLogOutcome(entry.id, "fees", event.target.value)
                                                              }
                                                            />
                                                            <CurrencyAmountHint value={feesValue} savedRate={entry.displayRate ?? null} />
                                                            {invalidFees ? (
                                                              <span className="block text-xs text-destructive">{tx("Fees must be zero or more.")}</span>
                                                            ) : null}
                                                          </label>
                                                        </div>
                                                      </fieldset>
                                                      <TradeExecutionFields entry={entry} onChange={updateLogOutcome} />
                                                    </div>
                                                  </details>
                                                </>
                                              ) : null}
                                              <label className="block space-y-1">
                                                <span className="text-sm font-medium">{tx("Notes")}</span>
                                                <textarea
                                                  aria-label={tx("Notes for {0}", [entry.ticker])}
                                                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                                  placeholder={tx("Add notes about this trade...")}
                                                  value={entry.notes ?? ""}
                                                  onChange={(event) => updateLogOutcome(entry.id, "notes", event.target.value)}
                                                />
                                              </label>
                                              <div className="flex justify-end">
                                                <Dialog.Close render={<Button size="sm" />}>{tx("Done")}</Dialog.Close>
                                              </div>
                                            </div>
                                          </Dialog.Popup>
                                        </Dialog.Portal>
                                      </Dialog.Root>
                                    </div>
                                    <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-1">
                                      <div
                                        role="radiogroup"
                                        aria-label={tx("{0} trade status", [entry.ticker])}
                                        className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground"
                                      >
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`trade-status-${entry.id}`}
                                            checked={entry.isOpen && !draft?.pendingClose}
                                            onChange={() => setLogEntryOpen(entry.id)}
                                          />{tx("Open")}</label>
                                        <label className="flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`trade-status-${entry.id}`}
                                            checked={!entry.isOpen || !!draft?.pendingClose}
                                            onChange={() => openTradeDetails(entry, true)}
                                          />{tx("Closed")}</label>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        title={tx("Load setup")}
                                        aria-label={tx("Load {0} setup into builder", [entry.ticker])}
                                        onClick={() => loadLogEntry(entry)}
                                      >
                                        <Upload aria-hidden />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={tx("Delete logged trade")}
                                        onClick={() => deleteLogEntry(entry.id)}
                                      >
                                        <Trash2 aria-hidden />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    ) : null}
                    <CardContent className={showTradeLog ? "pt-0" : undefined}>
                      <p className="text-center text-xs text-muted-foreground">{tx("Not shared between browsers or devices. Can be lost when browser site data is cleared. Use Backup in the header to download or restore your form and trade log.")}</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {tx(hasNonPositiveBalance(form)
                      ? "Your account balance needs to be greater than zero to size a trade."
                      : hasNonPositiveAtr(form)
                        ? "The daily ATR needs to be greater than zero to set the stop buffer."
                        : hasNonPositiveRisk(form)
                          ? "Your risk per trade needs to be greater than zero to size a trade."
                          : "Some inputs don't look like numbers. Go back and check them.")}
                  </CardContent>
                </Card>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => goToStep(0)}>{tx("Edit trade")}</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    update(initialState);
                    goToStep(0);
                  }}
                >{tx("Start over")}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-background/80 px-5 py-3 text-center text-[11px] text-muted-foreground lg:px-8">
        <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
          <a
            href={REPORT_ISSUE_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
          >{tx("Report a problem")}</a>
          <span aria-hidden="true">•</span>
          <a
            href={REPORT_EMAIL_URL}
            className="underline-offset-2 hover:underline"
          >{tx("Email feedback")}</a>
        </div>
      </footer>
    </div>
  );
}
