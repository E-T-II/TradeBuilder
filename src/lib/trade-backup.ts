import type { FormState, TradeLogEntry } from "@/components/trade-builder-app";

export const FORM_STORAGE_KEY = "tradebuilder-form-v3";
export const TRADE_LOG_STORAGE_KEY = "tradebuilder-log-v1";
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export const FORM_ENUM_VALUES = {
  direction: ["long", "short"],
  trend: ["uptrend", "sideways", "downtrend"],
  timeframe: ["daily", "weekly"],
  targetMode: ["percent", "ratio", "auto"],
} as const;

const FORM_FIELDS = {
  ticker: true,
  accountBalance: true,
  riskTolerance: true,
  targetBuffer: true,
  targetMode: true,
  direction: true,
  trend: true,
  timeframe: true,
  atr: true,
  curveLow: true,
  curveHigh: true,
  demandHigh: true,
  demandLow: true,
  supplyHigh: true,
  supplyLow: true,
  strength: true,
  time: true,
  freshness: true,
  opposingStrength: true,
  opposingTime: true,
  opposingFreshness: true,
  openTradeRisk: true,
  xltAcknowledgement: true,
} satisfies Record<keyof FormState, true>;

export interface TradeBackup {
  format: "tradebuilder-backup";
  version: 1;
  exportedAt: string;
  form: FormState;
  tradeLog: TradeLogEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isForm(value: unknown, partial: false): value is FormState;
function isForm(value: unknown, partial: true): value is Partial<FormState>;
function isForm(value: unknown, partial: boolean): boolean {
  if (!isRecord(value)) return false;
  const enums: Partial<Record<keyof FormState, readonly string[]>> = FORM_ENUM_VALUES;
  return Object.keys(FORM_FIELDS).every((key) => {
    if (partial && !Object.hasOwn(value, key)) return true;
    const field = value[key];
    const allowed = enums[key as keyof FormState];
    return typeof field === "string" && (!allowed || allowed.includes(field));
  });
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isOutcomeField(value: unknown, allowZero: boolean): boolean {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.trim() === "") return false;
  const number = Number(value);
  return Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
}

function isTradeLogEntry(value: unknown): value is TradeLogEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.trim() !== "" &&
    isDate(value.createdAt) &&
    typeof value.ticker === "string" &&
    (value.direction === "long" || value.direction === "short") &&
    typeof value.isOpen === "boolean" &&
    ["entry", "stop", "target", "positionSize", "capitalRequirement", "totalTradeRisk", "rewardRisk", "score"].every(
      (key) => typeof value[key] === "number" && Number.isFinite(value[key]),
    ) &&
    typeof value.positionSize === "number" &&
    Number.isSafeInteger(value.positionSize) &&
    value.positionSize > 0 &&
    typeof value.entry === "number" &&
    value.entry > 0 &&
    typeof value.target === "number" &&
    value.target > 0 &&
    typeof value.capitalRequirement === "number" &&
    value.capitalRequirement >= 0 &&
    typeof value.totalTradeRisk === "number" &&
    value.totalTradeRisk >= 0 &&
    typeof value.rewardRisk === "number" &&
    value.rewardRisk >= 0 &&
    typeof value.score === "number" &&
    value.score >= 0 &&
    value.score <= 10 &&
    isOutcomeField(value.exitPrice, false) &&
    isOutcomeField(value.fees, true) &&
    (value.form === undefined || isForm(value.form, true))
  );
}

export function parseTradeBackup(text: string): TradeBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error("The backup exceeds the 10 MB size limit.");
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON. Choose a Trade Builder backup (.json).");
  }
  if (!isRecord(value) || value.format !== "tradebuilder-backup") {
    throw new Error("This is not a Trade Builder backup.");
  }
  if (value.version !== 1) {
    throw new Error("This backup version is not supported. No data was changed.");
  }
  if (!isDate(value.exportedAt) || !isForm(value.form, false) || !Array.isArray(value.tradeLog)) {
    throw new Error("The backup is missing or has invalid form, date, or trade-log data.");
  }
  const ids = new Set<string>();
  const tradeLog: TradeLogEntry[] = [];
  for (const [index, entry] of value.tradeLog.entries()) {
    if (!isTradeLogEntry(entry) || ids.has(entry.id)) {
      throw new Error(`Trade ${index + 1} has invalid data or a duplicate ID. The entire backup was rejected.`);
    }
    ids.add(entry.id);
    tradeLog.push(entry);
  }
  return {
    format: "tradebuilder-backup",
    version: 1,
    exportedAt: value.exportedAt,
    form: value.form,
    tradeLog,
  };
}

export function createTradeBackup(form: FormState, tradeLog: TradeLogEntry[]): string {
  const text = JSON.stringify({
    format: "tradebuilder-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    form,
    tradeLog,
  }, null, 2);
  parseTradeBackup(text);
  return text;
}

export function restoreTradeBackup(storage: Storage, backup: TradeBackup): void {
  const previousForm = storage.getItem(FORM_STORAGE_KEY);
  storage.setItem(FORM_STORAGE_KEY, JSON.stringify(backup.form));
  try {
    storage.setItem(TRADE_LOG_STORAGE_KEY, JSON.stringify(backup.tradeLog));
  } catch (error) {
    try {
      if (previousForm === null) storage.removeItem(FORM_STORAGE_KEY);
      else storage.setItem(FORM_STORAGE_KEY, previousForm);
    } catch (rollbackError) {
      throw new Error(
        "Restore failed and the previous form could not be recovered. Keep your backup file and retry before reloading.",
        { cause: rollbackError },
      );
    }
    throw new Error("Restore failed. Your previous form and trade log were kept. Check browser storage permissions or available space.", {
      cause: error,
    });
  }
}
