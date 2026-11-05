export const EXECUTION_FIELDS = ["openedOn", "closedOn", "actualEntryPrice", "actualQuantity"] as const;
export type ExecutionField = (typeof EXECUTION_FIELDS)[number];
export type ExecutionDetails = Partial<Record<ExecutionField, string>>;

export function isTradeDate(value: string | undefined): value is string {
  if (!value || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
