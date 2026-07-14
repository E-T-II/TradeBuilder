"use client";

import type { TradeResult } from "@/lib/trade-builder";

const verdictLabel = {
  proximal: "Proximal entry",
  confirmation: "Confirmation entry",
  "no-trade": "No trade",
} as const;

const verdictClasses = {
  proximal:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  confirmation:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "no-trade": "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
} as const;

/**
 * Sticky bar pinned to the bottom of small screens: shows how many fields
 * are left, then the live score and verdict once the trade is scoreable.
 * Tapping it jumps to the full results.
 */
export function ScoreBar({
  result,
  missingCount,
  onView,
}: {
  result: TradeResult | null;
  missingCount: number;
  onView: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 text-left backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      {result ? (
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm">
            Score{" "}
            <span className="font-semibold tabular-nums">
              {result.scorecard.total} / 10
            </span>
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${verdictClasses[result.entryType]}`}
          >
            {verdictLabel[result.entryType]} · view
          </span>
        </span>
      ) : (
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {missingCount} field{missingCount === 1 ? "" : "s"} left to score
            your trade
          </span>
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(8, 100 - missingCount * 10)}%` }}
            />
          </span>
        </span>
      )}
    </button>
  );
}
