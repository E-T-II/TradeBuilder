import type { TradeLogEntry } from "@/components/trade-builder-app";
import { roundToCent } from "@/lib/trade-builder";

export const EXECUTION_FIELDS = ["openedOn", "closedOn", "actualEntryPrice", "actualQuantity"] as const;
export type ExecutionField = (typeof EXECUTION_FIELDS)[number];
export type ExecutionDetails = Partial<Record<ExecutionField, string>>;

export function isTradeDate(value: string | undefined): value is string {
  if (!value || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface TaxTradeRow {
  id: string;
  ticker: string;
  direction: "long" | "short";
  openedOn: string;
  closedOn: string;
  quantity: number;
  openingPrice: number;
  closingPrice: number;
  grossProceeds: number;
  purchaseCost: number;
  fees: number;
  netPnl: number;
}

export function taxTradeRecord(entry: TradeLogEntry): { row: TaxTradeRow | null; issues: string[] } {
  const issues: string[] = [];
  const openingPrice = Number(entry.actualEntryPrice);
  const closingPrice = Number(entry.exitPrice);
  const quantity = Number(entry.actualQuantity);
  const fees = entry.fees?.trim() ? Number(entry.fees) : 0;
  if (!entry.ticker.trim()) issues.push("Enter a ticker.");
  if (!isTradeDate(entry.openedOn)) issues.push("Enter a valid actual opening date.");
  if (!isTradeDate(entry.closedOn)) issues.push("Enter a valid actual closing date.");
  if (isTradeDate(entry.openedOn) && isTradeDate(entry.closedOn) && entry.closedOn < entry.openedOn) {
    issues.push("The closing date cannot be before the opening date.");
  }
  if (!Number.isFinite(openingPrice) || openingPrice <= 0) issues.push("Enter an actual opening price above zero.");
  if (!Number.isFinite(closingPrice) || closingPrice <= 0) issues.push("Enter an exit price above zero.");
  if (!Number.isFinite(quantity) || quantity <= 0) issues.push("Enter an actual share quantity above zero.");
  if (!Number.isFinite(fees) || fees < 0) issues.push("Fees must be zero or more.");
  if (entry.isOpen || issues.length || !isTradeDate(entry.openedOn) || !isTradeDate(entry.closedOn)) {
    return { row: null, issues };
  }
  const grossProceeds = roundToCent((entry.direction === "long" ? closingPrice : openingPrice) * quantity);
  const purchaseCost = roundToCent((entry.direction === "long" ? openingPrice : closingPrice) * quantity);
  const roundedFees = roundToCent(fees);
  const netPnl = roundToCent(grossProceeds - purchaseCost - roundedFees);
  if (![grossProceeds, purchaseCost, roundedFees, netPnl].every(Number.isFinite)) {
    return { row: null, issues: ["Execution amounts are too large to calculate."] };
  }
  return {
    issues,
    row: {
      id: entry.id, ticker: entry.ticker, direction: entry.direction,
      openedOn: entry.openedOn, closedOn: entry.closedOn, quantity,
      openingPrice, closingPrice, grossProceeds, purchaseCost, fees: roundedFees, netPnl,
    },
  };
}

export function buildTaxReport(entries: TradeLogEntry[], year: string) {
  const rows: TaxTradeRow[] = [];
  const problems: { id: string; ticker: string; issues: string[] }[] = [];
  let openCount = 0;
  let otherYearCount = 0;
  for (const entry of entries) {
    if (entry.isOpen) {
      openCount++;
      continue;
    }
    if (isTradeDate(entry.closedOn) && entry.closedOn.slice(0, 4) !== year) {
      otherYearCount++;
      continue;
    }
    const record = taxTradeRecord(entry);
    if (record.row) rows.push(record.row);
    else problems.push({ id: entry.id, ticker: entry.ticker, issues: record.issues });
  }
  rows.sort((a, b) => a.closedOn.localeCompare(b.closedOn) || a.ticker.localeCompare(b.ticker) || a.id.localeCompare(b.id));
  const totals = rows.reduce((sum, row) => ({
    grossProceeds: roundToCent(sum.grossProceeds + row.grossProceeds),
    purchaseCost: roundToCent(sum.purchaseCost + row.purchaseCost),
    fees: roundToCent(sum.fees + row.fees),
    netPnl: roundToCent(sum.netPnl + row.netPnl),
  }), { grossProceeds: 0, purchaseCost: 0, fees: 0, netPnl: 0 });
  return { rows, problems, totals, openCount, otherYearCount };
}
