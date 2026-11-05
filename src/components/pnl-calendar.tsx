"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roundToCent } from "@/lib/trade-builder";
import { isTradeDate } from "@/lib/trade-execution";
import { useLanguage } from "@/components/language-provider";

interface CalendarOutcome {
  closedOn?: string;
  pnl: number;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const signedUsd = (value: number) => value > 0 ? `+${usd.format(value)}` : usd.format(value);

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function PnlCalendar({ outcomes }: { outcomes: CalendarOutcome[] }) {
  const { text: tx, language } = useLanguage();
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Date(2026, 0, 4 + index).toLocaleDateString(language, { weekday: "short" }),
  );
  const [month, setMonth] = useState(currentMonth);
  const latestMonth = currentMonth();
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString(language, { month: "long", year: "numeric" });
  const daily = new Map<string, { pnl: number; count: number }>();
  let undatedCount = 0;
  for (const outcome of outcomes) {
    if (!isTradeDate(outcome.closedOn)) {
      undatedCount++;
      continue;
    }
    if (!outcome.closedOn.startsWith(`${month}-`)) continue;
    const previous = daily.get(outcome.closedOn);
    daily.set(outcome.closedOn, {
      pnl: roundToCent((previous?.pnl ?? 0) + outcome.pnl),
      count: (previous?.count ?? 0) + 1,
    });
  }
  const values = [...daily.values()];
  const maxMagnitude = Math.max(1, ...values.map((day) => Math.abs(day.pnl)));
  const monthPnl = roundToCent(values.reduce((sum, day) => sum + day.pnl, 0));
  const tradeCount = values.reduce((sum, day) => sum + day.count, 0);
  const weekCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7);
  const changeMonth = (offset: number) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setMonth(nextMonth > latestMonth ? latestMonth : nextMonth);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="outline" size="sm" />}>
        <CalendarDays aria-hidden />{tx("P&L Analysis")}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(70rem,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-4 shadow-lg outline-none sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl font-semibold">{tx("P&L Analysis")}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">{tx("Daily net P&L from closed trades, grouped by Closing date. Entered Profit/Loss takes priority; otherwise exit price and fees are used.")}</Dialog.Description>
            </div>
            <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close P&L Analysis")} />}>
              <X aria-hidden />
            </Dialog.Close>
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label={tx("Previous month")}
                disabled={month === "1000-01"} onClick={() => changeMonth(-1)}>
                <ChevronLeft aria-hidden />
              </Button>
              <label>
                <span className="sr-only">{tx("Calendar month")}</span>
                <Input type="month" min="1000-01" max={latestMonth} value={month}
                  className="w-36 text-center dark:scheme:light [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center"
                  onChange={(event) => {
                    const selectedMonth = event.target.value;
                    if (isTradeDate(`${selectedMonth}-01`)) {
                      setMonth(selectedMonth > latestMonth ? latestMonth : selectedMonth);
                    }
                  }} />
              </label>
              <Button variant="outline" size="icon" aria-label={tx("Next month")}
                disabled={month >= latestMonth} onClick={() => changeMonth(1)}>
                <ChevronRight aria-hidden />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonth())}>{tx("Today")}</Button>
            </div>
            <div aria-live="polite" className="text-right">
              <p className="font-mono text-lg font-semibold tabular-nums">{tx(signedUsd(monthPnl))}</p>
              <p className="text-xs text-muted-foreground">{tx("{0} closed {1} · {2} trading {3}", [tx(tradeCount), tx(tradeCount === 1 ? "trade" : "trades"), tx(daily.size), tx(daily.size === 1 ? "day" : "days")])}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-140 table-fixed border-collapse">
              <caption className="border-b px-3 py-2 text-left font-medium">{monthLabel}</caption>
              <thead>
                <tr>{weekdays.map((day) => (
                  <th key={day} scope="col" className="p-2 text-xs font-medium text-muted-foreground">{day}</th>
                ))}</tr>
              </thead>
              <tbody>
                {Array.from({ length: weekCount }, (_, week) => (
                  <tr key={week}>
                    {weekdays.map((_, weekday) => {
                      const day = week * 7 + weekday - firstDay.getDay() + 1;
                      if (day < 1 || day > daysInMonth) {
                        return <td key={weekday} className="border p-2" />;
                      }
                      const date = `${month}-${String(day).padStart(2, "0")}`;
                      const result = daily.get(date);
                      const color = result && result.pnl > 0 ? "16, 185, 129" : "239, 68, 68";
                      const intensity = result ? 0.1 + 0.4 * Math.abs(result.pnl) / maxMagnitude : 0;
                      return (
                        <td key={weekday}
                          aria-label={`${date}: ${result ? `${signedUsd(result.pnl)}, ${result.count} ${tx(result.count === 1 ? "trade" : "trades")}` : tx("No trades")}`}
                          className="h-28 border p-2 align-top sm:h-32 sm:p-3"
                          style={result && result.pnl !== 0 ? {
                            backgroundImage: `linear-gradient(135deg, rgba(${color}, ${intensity}), rgba(${color}, ${intensity * 0.45}))`,
                          } : undefined}>
                          <time dateTime={date} className="text-sm font-medium">{day}</time>
                          {result ? (
                            <div className="mt-4 space-y-1">
                              <p className="break-all font-mono text-xs font-semibold tabular-nums sm:text-sm">{tx(signedUsd(result.pnl))}</p>
                              <p className="text-xs text-muted-foreground">{tx(result.count)} {tx(result.count === 1 ? "trade" : "trades")}</p>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span aria-hidden className="h-3 w-16 rounded bg-linear-to-r from-emerald-500/10 to-emerald-500/50" />{tx("Profit")}</span>
            <span className="flex items-center gap-2"><span aria-hidden className="h-3 w-16 rounded bg-linear-to-r from-red-500/10 to-red-500/50" />{tx("Loss")}</span>
            <span>{tx("Darker = larger daily amount within this month. No fill = no trades or breakeven.")}</span>
          </div>
          {tradeCount === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{tx("No closed trades with P&L and a Closing date in {0}.", [monthLabel])}</p>
          ) : null}
          {undatedCount > 0 ? (
            <p role="status" className="mt-3 text-sm text-muted-foreground">{tx("{0} completed {1} not shown because the Closing date is missing or invalid.", [tx(undatedCount), tx(undatedCount === 1 ? "trade is" : "trades are")])}</p>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
