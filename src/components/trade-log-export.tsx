"use client";

import { Fragment, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { Button } from "@/components/ui/button";
import { roundToCent } from "@/lib/trade-builder";

type PrintEntry = TradeLogEntry & { realizedPnl: number | null };
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const signedUsd = (value: number) => value > 0 ? `+${usd.format(value)}` : usd.format(value);
const optionalPrice = (value: string | undefined) =>
  value?.trim() && Number.isFinite(Number(value)) ? usd.format(Number(value)) : "—";

export function TradeLogExport({ entries }: { entries: PrintEntry[] }) {
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
        <Printer aria-hidden />
        Print / Save PDF
      </Button>
      {printError ? <p role="alert" className="max-w-64 text-xs text-destructive">{printError}</p> : null}
      <article className="trade-log-print" aria-label="Printable trade log">
        <header>
          <h1>Trade Builder — Trade journal</h1>
          <p>Generated {new Date().toLocaleDateString("en-US")} | USD</p>
          <p>
            {entries.length} logged trades | {entries.filter((entry) => entry.isOpen).length} open |
            {" "}{completed.length} completed with P&amp;L | Net P&amp;L {signedUsd(total)}
          </p>
        </header>
        <table>
          <caption>All logged trades, including open trades and unfinished entries</caption>
          <thead>
            <tr>{["Trade / status", "Logged / closing date", "Planned entry / stop / target", "Planned shares", "Exit / fees", "Profit/Loss"].map((label) =>
              <th key={label} scope="col">{label}</th>,
            )}</tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <Fragment key={entry.id}>
                <tr>
                  <th scope="row">{entry.ticker}<br />{entry.direction === "long" ? "Buy" : "Sell short"}<br />{entry.isOpen ? "Open" : "Closed"}</th>
                  <td>{new Date(entry.createdAt).toLocaleString()}<br />{entry.closedOn || "—"}</td>
                  <td>{usd.format(entry.entry)} / {usd.format(entry.stop)} / {usd.format(entry.target)}</td>
                  <td>{entry.positionSize}</td>
                  <td>{optionalPrice(entry.exitPrice)} / {optionalPrice(entry.fees)}</td>
                  <td>{entry.realizedPnl === null ? "—" : signedUsd(entry.realizedPnl)}</td>
                </tr>
                <tr className="trade-log-entry-end">
                  <td colSpan={6}>
                    Capital {usd.format(entry.capitalRequirement)} | Risk {usd.format(entry.totalTradeRisk)} |
                    {" "}Reward:Risk {entry.rewardRisk.toFixed(2)}:1 | O.E. Score {entry.score} / 10
                    {entry.openedOn || entry.actualEntryPrice || entry.actualQuantity ? (
                      <p>Actual opening date: {entry.openedOn || "—"} | Actual opening price: {optionalPrice(entry.actualEntryPrice)} | Actual shares: {entry.actualQuantity || "—"}</p>
                    ) : null}
                    {entry.notes ? <p className="trade-log-notes">Notes: {entry.notes}</p> : null}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
        <footer>
          P&amp;L uses the entered Profit/Loss, or planned entry and shares less fees when no amount was entered.
          A dash means no value was recorded. This journal includes all trades regardless of Closing date.
        </footer>
      </article>
    </div>
  );
}
