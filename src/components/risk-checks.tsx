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

import { Check, X } from "lucide-react";
import type { TradeResult } from "@/lib/trade-builder";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Most rules are ceilings, so a failure reads as "Over the limit". The
// reward:risk rule is a floor (at least 3:1), where a failure is being *below*
// the minimum, so it passes its own failLabel instead.
function RuleRow({
  ok,
  label,
  failLabel = "Over the limit",
}: {
  ok: boolean;
  label: string;
  failLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          ok
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
        }`}
      >
        {ok ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <X className="size-3.5" aria-hidden />
        )}
        {ok ? "OK" : failLabel}
      </span>
    </div>
  );
}

export function RiskChecks({ result }: { result: TradeResult }) {
  if (!result.checks) return null;
  const c = result.checks;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <RuleRow
          ok={c.withinPerTradeRisk}
          label={`Risk within ${usd.format(c.maxAccountRisk)} (${c.riskLimitPct}% per trade)`}
        />
        <RuleRow ok={c.withinCapitalCap} label="Capital within 50% of balance" />
        <RuleRow
          ok={c.meetsRewardRisk}
          label="Reward : risk at least 3:1"
          failLabel="Below 3:1"
        />
        <RuleRow
          ok={c.withinMultiTradeRisk}
          label={`Open risk within ${usd.format(c.multiTradeLimit)} (6% rule)`}
        />
      </CardContent>
    </Card>
  );
}
