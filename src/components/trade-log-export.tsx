"use client";

import { Fragment, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { Button } from "@/components/ui/button";
import { roundToCent } from "@/lib/trade-builder";
import { useLanguage } from "@/components/language-provider";

type PrintEntry = TradeLogEntry & { realizedPnl: number | null };
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const signedUsd = (value: number) => value > 0 ? `+${usd.format(value)}` : usd.format(value);
const optionalPrice = (value: string | undefined) =>
  value?.trim() && Number.isFinite(Number(value)) ? usd.format(Number(value)) : "—";

export function TradeLogExport({ entries }: { entries: PrintEntry[] }) {
  const { text: tx } = useLanguage();
  const [printError, setPrintError] = useState("");
  const completed = entries.filter((entry) => entry.realizedPnl !== null);
  const total = roundToCent(completed.reduce((sum, entry) => sum + (entry.realizedPnl ?? 0), 0));

  useEffect(() => {
    const reset = () => { delete document.body.dataset.printReport; };
    window.addEventListener("afterprint", reset);
    return () => {
      window.removeEventListener("afterprint", reset);
      reset();
    };
  }, []);

  const print = () => {
    setPrintError("");
    document.body.dataset.printReport = "trade-log";
    try {
      window.print();
    } catch {
      delete document.body.dataset.printReport;
      setPrintError("Printing could not be opened. Check your browser settings and try again.");
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={print}>
        <Printer aria-hidden />{tx("Print / Save PDF")}</Button>
      {printError ? <p role="alert" className="max-w-64 text-xs text-destructive">{tx(printError)}</p> : null}
      <article className="trade-log-print" aria-label={tx("Printable trade log")}>
        <header>
          <h1>{tx("Trade Builder — Trade journal")}</h1>
          <p>{tx("Generated {0} | USD", [tx(new Date().toLocaleDateString("en-US"))])}</p>
          <p>
            {tx(entries.length)} {tx("logged trades |")} {entries.filter((entry) => entry.isOpen).length} {tx("open |")}{" "}{tx(completed.length)} {tx("completed with P&L | Net P&L")} {tx(signedUsd(total))}
          </p>
        </header>
        <table>
          <caption>{tx("All logged trades, including open trades and unfinished entries")}</caption>
          <thead>
            <tr>{["Trade / status", "Logged / closing date", "Planned entry / stop / target", "Planned shares", "Exit / fees", "Profit/Loss"].map((label) =>
              <th key={label} scope="col">{tx(label)}</th>,
            )}</tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <Fragment key={entry.id}>
                <tr>
                  <th scope="row">{entry.ticker}<br />{tx(entry.direction === "long" ? "Buy" : "Sell short")}<br />{tx(entry.isOpen ? "Open" : "Closed")}</th>
                  <td>{new Date(entry.createdAt).toLocaleString()}<br />{tx(entry.closedOn || "—")}</td>
                  <td>{tx(usd.format(entry.entry))} / {tx(usd.format(entry.stop))} / {tx(usd.format(entry.target))}</td>
                  <td>{tx(entry.positionSize)}</td>
                  <td>{tx(optionalPrice(entry.exitPrice))} / {tx(optionalPrice(entry.fees))}</td>
                  <td>{tx(entry.realizedPnl === null ? "—" : signedUsd(entry.realizedPnl))}</td>
                </tr>
                <tr className="trade-log-entry-end">
                  <td colSpan={6}>{tx("Capital")} {tx(usd.format(entry.capitalRequirement))} {tx("| Risk")} {tx(usd.format(entry.totalTradeRisk))} |
                    {tx(" ")}{tx("Reward:Risk")} {tx(entry.rewardRisk.toFixed(2))}{tx(":1 | O.E. Score")} {tx(entry.score)} / 10
                    {entry.openedOn || entry.actualEntryPrice || entry.actualQuantity ? (
                      <p>{tx("Actual opening date: {0} | Actual opening price: {1} | Actual shares: {2}", [tx(entry.openedOn || "—"), tx(optionalPrice(entry.actualEntryPrice)), tx(entry.actualQuantity || "—")])}</p>
                    ) : null}
                    {entry.notes ? <p className="trade-log-notes">{tx("Notes: {0}", [entry.notes])}</p> : null}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
        <footer>{tx("P&L uses the entered Profit/Loss, or planned entry and shares less fees when no amount was entered. A dash means no value was recorded. This journal includes all trades regardless of Closing date.")}</footer>
      </article>
    </div>
  );
}
