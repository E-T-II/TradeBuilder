"use client";

import type { TradeLogEntry } from "@/components/trade-builder-app";
import { Input } from "@/components/ui/input";
import type { ExecutionField } from "@/lib/trade-execution";

export function TradeExecutionFields({
  entry, onChange,
}: {
  entry: TradeLogEntry;
  onChange: (id: string, field: ExecutionField, value: string) => void;
}) {
  const now = new Date();
  const maxDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return (
    <fieldset className="space-y-2 rounded-md border p-3">
      <legend className="px-1 text-xs font-medium">Actual execution (optional)</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["openedOn", "Actual opening date", "date"],
          ["actualEntryPrice", "Actual opening price ($)", "number"],
          ["actualQuantity", "Actual shares", "number"],
        ] as const).map(([field, label, type]) => (
          <label key={field} className="space-y-1">
            <span className="text-xs font-medium">{label}</span>
            <Input
              aria-label={`${label} for ${entry.ticker}`}
              type={type}
              min={type === "number" ? "0" : undefined}
              max={type === "date" ? maxDate : undefined}
              step={type === "number" ? "any" : undefined}
              className={type === "date" ? "dark:scheme:light" : undefined}
              value={entry[field] ?? ""}
              onChange={(event) => onChange(entry.id, field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
